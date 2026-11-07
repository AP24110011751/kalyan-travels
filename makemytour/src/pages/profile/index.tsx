import React, { useEffect, useState } from "react";
import {
  User,
  Phone,
  Mail,
  Edit2,
  MapPin,
  Calendar,
  CreditCard,
  X,
  Check,
  LogOut,
  Plane,
  Building2,
  XCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { clearUser, setUser } from "@/store";
import CancellationModal from "@/components/CancellationModal";
import RefundTracker from "@/components/RefundTracker";

import { editprofile } from "@/api";

interface RefundEntry {
  bookingId: string;
  bookingType: string;
  reason: string;
  refundAmount: number;
  cancelledAt: string;
  status: "pending" | "processing" | "completed";
}

const REFUND_STATUS_ADVANCE_MS = 2 * 60 * 1000;
const REFUND_COMPLETE_MS = 4 * 60 * 1000;

const saveRefunds = (refunds: RefundEntry[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("mmt_refunds", JSON.stringify(refunds));
};

const advanceRefundStatuses = (refunds: RefundEntry[]): RefundEntry[] => {
  const now = Date.now();
  return refunds.map((r) => {
    const age = now - new Date(r.cancelledAt).getTime();
    if (r.status === "pending" && age >= REFUND_STATUS_ADVANCE_MS) {
      return { ...r, status: "processing" as const };
    }
    if (r.status === "processing" && age >= REFUND_COMPLETE_MS) {
      return { ...r, status: "completed" as const };
    }
    return r;
  });
};

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.user);
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
  });

  // ✅ Fix: start with empty arrays, load from localStorage in useEffect
  const [cancelledIds, setCancelledIds] = useState<string[]>([]);
  const [refunds, setRefunds] = useState<RefundEntry[]>([]);
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  // ✅ Load from localStorage only after mount (client-side only)
  useEffect(() => {
    setMounted(true);
    try {
      const storedIds = JSON.parse(
        localStorage.getItem("mmt_cancelled") || "[]"
      );
      setCancelledIds(storedIds);
    } catch {
      setCancelledIds([]);
    }

    try {
      const storedRefunds = JSON.parse(
        localStorage.getItem("mmt_refunds") || "[]"
      );
      setRefunds(advanceRefundStatuses(storedRefunds));
    } catch {
      setRefunds([]);
    }
  }, []);

  // ✅ Advance statuses on a timer
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setRefunds((prev) => {
        const updated = advanceRefundStatuses(prev);
        saveRefunds(updated);
        return updated;
      });
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  const logout = () => {
    dispatch(clearUser());
    router.push("/");
  };

  const handleSave = async () => {
    try {
      const data = await editprofile(
        user?.id,
        userData.firstName,
        userData.lastName,
        userData.email,
        userData.phoneNumber
      );
      dispatch(setUser(data));
      setIsEditing(false);
    } catch {
      setIsEditing(false);
    }
  };

  const handleEditFormChange = (field: string, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const handleCancelClick = (booking: any) => {
    setCancelTarget(booking);
  };

  const handleCancelConfirm = (
    bookingId: string,
    reason: string,
    refundAmount: number
  ) => {
    const updated = [...cancelledIds, bookingId];
    setCancelledIds(updated);
    localStorage.setItem("mmt_cancelled", JSON.stringify(updated));

    const newRefund: RefundEntry = {
      bookingId,
      bookingType: cancelTarget?.type || "Booking",
      reason,
      refundAmount,
      cancelledAt: new Date().toISOString(),
      status: "pending",
    };
    const updatedRefunds = [newRefund, ...refunds];
    setRefunds(updatedRefunds);
    saveRefunds(updatedRefunds);
    setCancelTarget(null);
  };

  const bookings: any[] = user?.bookings || [];
  const activeBookings = bookings.filter(
    (b: any) => !cancelledIds.includes(b.bookingId)
  );
  const cancelledBookings = bookings.filter((b: any) =>
    cancelledIds.includes(b.bookingId)
  );

  // ✅ Don't render until client-side mount to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-8 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Profile Section */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Profile</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-red-600 flex items-center space-x-1 hover:text-red-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {["firstName", "lastName", "email", "phoneNumber"].map(
                    (field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field === "phoneNumber"
                            ? "Phone Number"
                            : field === "firstName"
                              ? "First Name"
                              : field === "lastName"
                                ? "Last Name"
                                : "Email"}
                        </label>
                        <input
                          type={
                            field === "email"
                              ? "email"
                              : field === "phoneNumber"
                                ? "tel"
                                : "text"
                          }
                          value={(userData as any)[field]}
                          onChange={(e) =>
                            handleEditFormChange(field, e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                    )
                  )}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <p className="font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <p>{user?.email}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <p>{user?.phoneNumber}</p>
                  </div>
                  <button
                    className="w-full mt-4 flex items-center justify-center space-x-2 text-red-600 hover:text-red-700"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bookings Section */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">My Bookings</h2>
              {activeBookings.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No active bookings found.
                </p>
              ) : (
                <div className="space-y-6">
                  {activeBookings.map((booking: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                        <div className="flex items-center space-x-3">
                          {booking?.type === "Flight" ? (
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Plane className="w-6 h-6 text-blue-600" />
                            </div>
                          ) : (
                            <div className="bg-green-100 p-2 rounded-lg">
                              <Building2 className="w-6 h-6 text-green-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{booking?.type}</h3>
                            <p className="text-sm text-gray-500">
                              Booking ID: {booking?.bookingId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">
                              ₹{booking?.totalPrice.toLocaleString("en-IN")}
                            </p>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Confirmed
                            </span>
                          </div>
                          <button
                            onClick={() => handleCancelClick(booking)}
                            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 border border-red-300 hover:border-red-500 rounded-lg px-3 py-1.5 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(booking?.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{booking?.type}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CreditCard className="w-4 h-4" />
                          <span>Paid</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cancelledBookings.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-500">
                  Cancelled Bookings
                </h2>
                <div className="space-y-4">
                  {cancelledBookings.map((booking: any, index: number) => (
                    <div
                      key={index}
                      className="border border-dashed border-red-200 rounded-lg p-4 bg-red-50 opacity-75"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-3">
                          {booking?.type === "Flight" ? (
                            <Plane className="w-5 h-5 text-gray-400" />
                          ) : (
                            <Building2 className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <h3 className="font-medium text-gray-500">
                              {booking?.type}
                            </h3>
                            <p className="text-xs text-gray-400">
                              {booking?.bookingId}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                          Cancelled
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <RefundTracker refunds={refunds} />
          </div>
        </div>
      </div>

      <CancellationModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        booking={cancelTarget}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
};

export default ProfilePage;