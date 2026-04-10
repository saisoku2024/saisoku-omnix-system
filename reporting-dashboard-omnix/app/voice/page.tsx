"use client";

import { useEffect, useState } from "react";
import { getVoiceDaily } from "@/lib/api";

export default function VoicePage() {
const [data, setData] = useState([]);

useEffect(() => {
getVoiceDaily().then(setData);
}, []);

return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
