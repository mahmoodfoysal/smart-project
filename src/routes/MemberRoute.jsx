"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "axios";
import Link from "next/link";
import Forbidden from "@/components/pages/Forbidden";

const MemberRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);
  const router = useRouter();
  const [isMember, setIsMember] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!loading && !user) {
        router.push("/login");
        return;
      }

      if (user && user.email) {
        try {
          const res = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/get-admin-list/${user.email}`,
          );
          const fetchedData = res.data?.list_data || res.data?.data || res.data;

          // Ensure we handle arrays or single objects
          const userData = Array.isArray(fetchedData)
            ? fetchedData.find((u) => u.email === user.email) || fetchedData[0]
            : fetchedData;

          if (
            userData &&
            userData.email === user.email &&
            (userData.role_id === 202 ||
              userData.role_id === 201 ||
              userData.role_id === 200)
          ) {
            setIsMember(true);
          }
        } catch (error) {
          console.error("Admin verification failed:", error);
        } finally {
          setIsVerifying(false);
        }
      } else if (!loading) {
        setIsVerifying(false);
      }
    };

    verifyAdmin();
  }, [user, loading, router]);

  if (loading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isMember) {
    return <Forbidden></Forbidden>;
  }

  return <>{children}</>;
};

export default MemberRoute;
