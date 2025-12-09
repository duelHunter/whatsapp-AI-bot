 "use client";

 import { ThemeProvider as NextThemesProvider } from "next-themes";
 import { ReactNode } from "react";

 type Props = {
   children: ReactNode;
 };

 export function ThemeProvider({ children }: Props) {
   return (
     <NextThemesProvider
       attribute="class"
       defaultTheme="dark"
       enableSystem
       disableTransitionOnChange
     >
       {children}
     </NextThemesProvider>
   );
 }

