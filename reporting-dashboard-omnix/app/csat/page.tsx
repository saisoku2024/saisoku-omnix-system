"use client";

import { useEffect, useState } from "react";
import { getCsatSummary } from "@/lib/api";

export default function CsatPage() {
const [data, setData] = useState(null);

useEffect(() => {
getCsatSummary().then(setData);
}, []);

return <pre>{JSON.stringify(data, null, 2)}</pre>;
}