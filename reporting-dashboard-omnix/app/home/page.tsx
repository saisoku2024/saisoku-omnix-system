"use client";

import { useEffect, useState } from "react";
import { getDashboardSummary } from "@/lib/api";

export default function HomePage() {
const [data, setData] = useState(null);

useEffect(() => {
getDashboardSummary().then(setData);
}, []);

if (!data) return <div>Loading...</div>;

return ( <div> <h1>Home</h1> <pre>{JSON.stringify(data, null, 2)}</pre> </div>
);
}
