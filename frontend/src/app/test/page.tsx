"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

export default function TestPage() {
  const { getToken } = useAuth();

  useEffect(() => {
    const callAPI = async () => {
      const token = await getToken();

      const res = await fetch("http://localhost:3000/api/blocks?projectId=cd1a16c0-24d6-4e45-970d-bf5da10398bd", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log(data);
    };

    callAPI();
  }, []);

  return <div>Check console</div>;
}