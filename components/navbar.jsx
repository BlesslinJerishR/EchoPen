import Link from 'next/link'

export default function Navbar() {
  return (
    <nav style={{backgroundColor: '#000000', borderBottom: '1px solid #333333'}}>
      <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 1rem'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem'}}>
          <Link href="/" style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff'}}>
            Echo Pen
          </Link>
          <div style={{display: 'flex', gap: '1.5rem'}}>
            <Link href="/composer" className="hover-link" style={{color: '#ffffff', transition: 'color 0.2s'}}>
              Composer
            </Link>
            <Link href="/config" className="hover-link" style={{color: '#ffffff', transition: 'color 0.2s'}}>
              API Config
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
