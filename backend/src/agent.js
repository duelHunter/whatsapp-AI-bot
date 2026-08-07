require('dotenv').config();
const axios = require('axios');
const orderService = require('./services/orderService');
const { searchKB } = require('./rag');

const AI_API_KEY = process.env.AI_API_KEY || 'ollama';
const AI_MODEL = process.env.AI_MODEL || 'gemma4:latest';
const AI_URL = process.env.AI_BASE_URL || 'http://127.0.0.1:11434/v1/chat/completions';
const MAX_TOOL_ITERATIONS = 10;

const AGENT_SYSTEM_PROMPT = `You are a friendly and helpful bookstore assistant on WhatsApp. You help customers browse books, manage their shopping cart, and place orders.

Your capabilities:
- Search the book catalog by title, author, or category
- Show book details including price and availability
- Manage the customer's shopping cart (add, update, remove items)
- Confirm orders and provide bank transfer payment details
- Check order status and history
- Answer general questions using the knowledge base

Guidelines:
- Be conversational and warm, but concise — this is WhatsApp messaging
- When showing books, format them as a numbered list with title, author, price, and stock
- When a customer wants to add a book, use the book's ID from search results
- Always show the cart total after modifications
- When confirming an order, clearly display the bank transfer details and ask the customer to send a photo of their transfer receipt
- If a book is out of stock, let the customer know and suggest alternatives
- Use emojis sparingly to keep messages friendly
- For questions unrelated to books/orders, use the search_kb tool to find answers from the knowledge base`;

const tools = [
    {
        type: 'function',
        function: {
            name: 'search_books',
            description: 'Search the book catalog by title, author, or category. Returns matching books with price and availability.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search query — book title, author name, or keyword' },
                    category: { type: 'string', description: 'Optional category filter (e.g., Fiction, Programming, Science)' },
                },
                required: ['query'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_book_details',
            description: 'Get full details of a specific book including description, ISBN, and stock.',
            parameters: {
                type: 'object',
                properties: {
                    book_id: { type: 'string', description: 'The UUID of the book' },
                },
                required: ['book_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_cart',
            description: "View the customer's current shopping cart with all items and total.",
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function',
        function: {
            name: 'add_to_cart',
            description: "Add a book to the customer's shopping cart.",
            parameters: {
                type: 'object',
                properties: {
                    book_id: { type: 'string', description: 'The UUID of the book to add' },
                    quantity: { type: 'integer', description: 'Number of copies to add (default 1)' },
                },
                required: ['book_id'],
            }, 
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_cart_item',
            description: 'Update the quantity of an item already in the cart.',
            parameters: {
                type: 'object',
                properties: {
                    order_item_id: { type: 'string', description: 'The UUID of the order item to update' },
                    quantity: { type: 'integer', description: 'New quantity' },
                },
                required: ['order_item_id', 'quantity'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'remove_from_cart',
            description: 'Remove an item from the cart.',
            parameters: {
                type: 'object',
                properties: {
                    order_item_id: { type: 'string', description: 'The UUID of the order item to remove' },
                },
                required: ['order_item_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'confirm_order',
            description: 'Finalize the cart and confirm the order. Returns bank transfer details for payment. Only call this when the customer explicitly wants to place/confirm their order.',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function',
        function: {
            name: 'cancel_order',
            description: 'Cancel an order.',
            parameters: {
                type: 'object',
                properties: {
                    order_id: { type: 'string', description: 'The UUID of the order to cancel. If not provided, cancels the most recent non-draft order.' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_order_status',
            description: 'Check the status of an order.',
            parameters: {
                type: 'object',
                properties: {
                    order_id: { type: 'string', description: 'The UUID of the order. If not provided, returns the most recent order.' },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_order_history',
            description: "View the customer's past orders.",
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function',
        function: {
            name: 'search_kb',
            description: 'Search the knowledge base for general questions unrelated to book ordering (e.g., store hours, return policy, contact info).',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'The question or search query' },
                },
                required: ['query'],
            },
        },
    },
];

async function executeTool(name, args, ctx) {
    console.log(`🔧 Tool called: ${name}`, JSON.stringify(args));
    const startTime = Date.now();
    try {
        switch (name) {
            case 'search_books': {
                console.log(`🔍 search_books orgId: ${ctx.orgId}`);
                const books = await orderService.searchBooks(ctx.orgId, args.query, args.category);
                if (!books || books.length === 0) {
                    return { books: [], message: `No books found matching "${args.query}"${args.category ? ` in category "${args.category}"` : ''}. Do not search again with the same query. Tell the customer this title is not available in our catalog.` };
                }
                return { books };
            }

            case 'get_book_details':
                return await orderService.getBookDetails(ctx.orgId, args.book_id) || { error: 'Book not found' };

            case 'get_cart':
                return await orderService.getCart(ctx.orgId, ctx.contactId);

            case 'add_to_cart':
                return await orderService.addToCart(ctx.orgId, ctx.contactId, ctx.conversationId, args.book_id, args.quantity || 1);

            case 'update_cart_item':
                return await orderService.updateCartItem(args.order_item_id, args.quantity);

            case 'remove_from_cart':
                return await orderService.removeFromCart(args.order_item_id);

            case 'confirm_order':
                return await orderService.confirmOrder(ctx.orgId, ctx.contactId);

            case 'cancel_order': {
                if (args.order_id) {
                    return await orderService.cancelOrder(args.order_id);
                }
                const status = await orderService.getOrderStatus(ctx.orgId, ctx.contactId);
                if (status.error) return status;
                return await orderService.cancelOrder(status.order_id);
            }

            case 'get_order_status':
                return await orderService.getOrderStatus(ctx.orgId, ctx.contactId, args.order_id);

            case 'get_order_history':
                return { orders: await orderService.getOrderHistory(ctx.orgId, ctx.contactId) };

            case 'search_kb': {
                const results = await searchKB(args.query, { topK: 3, orgId: ctx.orgId, waAccountId: ctx.orgId });
                if (!results || results.length === 0) {
                    return { answer: 'No relevant information found in the knowledge base.' };
                }
                return {
                    snippets: results.map(r => ({
                        text: r.text,
                        source: r.title,
                        score: r.score,
                    })),
                };
            }

            default:
                return { error: `Unknown tool: ${name}` };
        }
    } catch (err) {
        console.error(`❌ Agent tool error (${name}):`, err);
        return { error: err.message || 'An error occurred while processing your request.' };
    } finally {
        console.log(`   ⏱️ ${name} completed in ${Date.now() - startTime}ms`);
    }
}

async function llmChat(messages, useTools = true) {
    const payload = {
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        top_p: 1.0,
        max_tokens: 1024,
        stream: false,
    };
    if (useTools) {
        payload.tools = tools;
        payload.tool_choice = 'auto';
    }
    console.log('📤 LLM request payload:', JSON.stringify(payload, null, 2));
    const response = await axios.post(AI_URL, payload, {
        headers: {
            Authorization: `Bearer ${AI_API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
    console.log('📥 LLM response:', JSON.stringify(response.data, null, 2));
    return response.data;
}

async function runAgent({ conversationHistory, userMessage, toolContext, returnToolLogs = false }) {
    if (!AI_API_KEY) {
        const errMsg = "AI Error: AI_API_KEY not configured.";
        return returnToolLogs ? { reply: errMsg, toolLogs: [] } : errMsg;
    }

    const toolLogs = [];

    const messages = [
        { role: 'system', content: AGENT_SYSTEM_PROMPT },
    ];

    // GUARDRAIL: sanitize history before handing it to the model —
    // drop a leading orphan (a turn whose partner got cut off by the fetch window,
    // e.g. history starting with 'assistant' with no preceding 'user'), and collapse
    // consecutive duplicate turns (same role + content, e.g. a message processed twice).
    //this helps to llm understand the context better and avoid confusion or repetition in its responses.
    const sanitizedHistory = [];
    for (const msg of (conversationHistory || [])) {
        if (!msg.content) continue;
        if (sanitizedHistory.length === 0 && msg.role !== 'user') continue;
        const prev = sanitizedHistory[sanitizedHistory.length - 1];
        if (prev && prev.role === msg.role && prev.content === msg.content) continue;
        sanitizedHistory.push({ role: msg.role, content: msg.content });
    }
    messages.push(...sanitizedHistory);
    messages.push({ role: 'user', content: userMessage });

    let iterations = 0;

    while (iterations < MAX_TOOL_ITERATIONS) {
        const completion = await llmChat(messages, true);

        const choice = completion.choices?.[0];
        if (!choice) break;

        const responseMessage = choice.message;

        // GUARDRAIL: model emitted the tool call as text instead of structured tool_calls —
        // parse it out and treat it as a real tool call rather than leaking it to the customer.
        if ((!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) && FAKE_TOOL_CALL_PATTERN.test(responseMessage.content || '')) {
            const fallbackCalls = parseFallbackToolCalls(responseMessage.content);
            if (fallbackCalls.length > 0) {
                console.warn('⚠️ Model emitted tool call as text, using fallback parser:', fallbackCalls.map(c => c.name));
                responseMessage.tool_calls = fallbackCalls.map((c, i) => ({
                    id: `fallback_${Date.now()}_${i}`,
                    function: { name: c.name, arguments: JSON.stringify(c.arguments) },
                }));
                responseMessage.content = null;
            }
        }

        messages.push(responseMessage);

        if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
            let reply = responseMessage.content?.trim() || "I'm sorry, I couldn't process that request. Please try again.";
            // GUARDRAIL: never let leaked internal/tool syntax reach the customer.
            if (containsLeakedInternalSyntax(reply)) {
                console.warn('⚠️ Blocked reply containing leaked internal syntax:', reply);
                reply = "Sorry, I had trouble processing that. Could you rephrase your request?";
            }
            return returnToolLogs ? { reply, toolLogs } : reply;
        }

        iterations++;
        console.log(`🔧 Agent tool call iteration ${iterations}:`, responseMessage.tool_calls.map(tc => tc.function.name));

        for (const toolCall of responseMessage.tool_calls) {
            const { name, arguments: argsStr } = toolCall.function;
            let args = {};
            try {
                args = JSON.parse(argsStr);
            } catch {
                args = {};
            }

            const result = await executeTool(name, args, toolContext);
            toolLogs.push({ tool: name, args, result });

            messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
            });
        }
    }

    if (iterations >= MAX_TOOL_ITERATIONS) {
        console.warn('⚠️ Agent reached max tool iterations');
    }

    const finalCompletion = await llmChat(messages, false);
    let reply = finalCompletion.choices?.[0]?.message?.content?.trim() || "I'm sorry, I couldn't process that request. Please try again.";
    // GUARDRAIL: same leaked-syntax check applies to the max-iterations fallback path.
    if (containsLeakedInternalSyntax(reply)) {
        console.warn('⚠️ Blocked reply containing leaked internal syntax:', reply);
        reply = "Sorry, I had trouble processing that. Could you rephrase your request?";
    }
    return returnToolLogs ? { reply, toolLogs } : reply;
}

module.exports = { runAgent };
