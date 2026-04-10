"use client";
import Link from "next/link";

export default function Sidebar() {
return ( <div className="w-60 h-screen bg-slate-800 p-4 space-y-4"> <h2 className="font-bold text-lg">OMNIX</h2>

```
  <Link href="/home">Home</Link>
  <Link href="/omnix">Omnix</Link>
  <Link href="/voice">Voice</Link>
  <Link href="/csat">CSAT</Link>
  <Link href="/upload">Upload</Link>
</div>
```

);
}
