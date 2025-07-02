import type { Metadata } from "next";
import LayoutWrapper from "@/components/LayoutWrapper";

import "../globals.css";

export const metadata: Metadata = {
    title: "Litecoin Projects",
    description: "Litecoin Open-Source Projects",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div lang="en">
            <body
                className={`antialiased`}
            >
                <LayoutWrapper>
                    {children}
                </LayoutWrapper>
            </body>
        </div>
    );
}
