import "./globals.css"
import Navbar from "@/components/navbar"
import { Inter } from 'next/font/google'

const poppins = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "Echo Pen - write once, publish everywhere",
  description: "Minimal offline-first social posting",
  icons: {
    icon: "https://img.icons8.com/3d-fluency/50/pen.png"
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{backgroundColor: '#000000'}}>
      <body className={poppins.className} style={{backgroundColor: '#000000', color: '#ffffff', margin: 0, padding: 0}}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}

