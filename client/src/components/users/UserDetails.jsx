import React, { useState, useEffect, useCallback } from "react";
import Drawer from "../common/Drawer.jsx";
import Badge from "../common/Badge.jsx";
import Button from "../common/Button.jsx";
import { formatINR, formatGrams, formatDate } from "../../utils/formatters.js";
import {
  User,
  Users,
  ShieldCheck,
  Coins,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Landmark,
  CreditCard,
  QrCode,
  ExternalLink,
  Eye,
  FileText,
  AlertTriangle,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Tag,
  X,
  Gift,
  Sparkles,
  Clock,
  RefreshCw,
} from "lucide-react";
import { adminUsersApi, getMediaUrl } from "../../services/api.js";
import { useToast } from "../common/Toast.jsx";

export default function UserDetails({ user, isOpen, onClose, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // { url, title } for modal lightbox
  const { addToast } = useToast();

  // Referrals tab state
  const [referralData, setReferralData] = useState(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState(null);

  const fetchReferrals = useCallback(async (userId) => {
    if (!userId) return;
    setReferralLoading(true);
    setReferralError(null);
    try {
      const response = await adminUsersApi.getUserReferrals(userId);
      if (response && response.success) {
        setReferralData(response.data);
      } else {
        throw new Error(response?.message || "Failed to load referrals");
      }
    } catch (err) {
      console.error("Referrals fetch error:", err);
      setReferralError(err.message || "Failed to load referrals");
    } finally {
      setReferralLoading(false);
    }
  }, []);

  // Reset referral state whenever a different user drawer is opened
  useEffect(() => {
    if (isOpen) {
      setReferralData(null);
      setReferralError(null);
      setActiveTab("profile");
    }
  }, [isOpen, user?.rawId || user?.id]);

  // Load referrals on demand when the Referrals tab is opened
  useEffect(() => {
    if (
      isOpen &&
      activeTab === "referrals" &&
      !referralData &&
      !referralLoading &&
      !referralError
    ) {
      fetchReferrals(user?.rawId || user?.id);
    }
  }, [
    isOpen,
    activeTab,
    referralData,
    referralLoading,
    referralError,
    user,
    fetchReferrals,
  ]);

  if (!user) return null;

  const handleToggleBlock = async () => {
    setActionLoading(true);
    try {
      const willBlock = user.status === "Active";
      await adminUsersApi.toggleBlockUser(user.rawId || user.id, willBlock);
      const newStatus = willBlock ? "Blocked" : "Active";
      addToast(
        `User ${user.name} (${user.id}) ${willBlock ? "blocked" : "unblocked"} successfully`,
        willBlock ? "error" : "success",
      );
      if (onUserUpdate)
        onUserUpdate(user.id, { status: newStatus, isBlocked: willBlock });
    } catch (err) {
      addToast(err.message || "Failed to update user status", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleKycStatusUpdate = async (newKycStatus) => {
    setActionLoading(true);
    try {
      await adminUsersApi.updateKycStatus(
        user.rawId || user.id,
        newKycStatus.toLowerCase(),
      );
      addToast(
        `KYC for ${user.name} marked as ${newKycStatus}`,
        newKycStatus === "Verified" ? "success" : "error",
      );
      if (onUserUpdate) onUserUpdate(user.id, { kycStatus: newKycStatus });
    } catch (err) {
      addToast(err.message || "Failed to update KYC status", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "kyc", label: "KYC Info", icon: ShieldCheck },
    {
      id: "bank",
      label: `Bank & UPI (${(user.bankAccounts?.length || 0) + (user.upiAccounts?.length || 0)})`,
      icon: Landmark,
    },
    { id: "wallet", label: "Asset Holdings", icon: Coins },
    { id: "referrals", label: "Referrals", icon: Users },
  ];

  const kycDocs = [
    {
      id: "pan",
      title: "PAN Card Document",
      subtitle: user.panNumber
        ? `PAN: ${user.panNumber}`
        : "Tax Identification",
      path: user.kycDocuments?.panCard || user.kyc?.panCard,
    },
    {
      id: "aadhaarFront",
      title: "Aadhaar Card (Front)",
      subtitle: "Government ID Document",
      path: user.kycDocuments?.aadhaarFront || user.kyc?.aadhaarFront,
    },
    {
      id: "aadhaarBack",
      title: "Aadhaar Card (Back)",
      subtitle: "Address Verification Document",
      path: user.kycDocuments?.aadhaarBack || user.kyc?.aadhaarBack,
    },
  ];

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`${user.name} (${user.id})`}
        subtitle={`Member since ${formatDate(user.createdAt)} · Role: ${user.role || "Individual"}`}
        width="max-w-3xl"
        footer={
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge status={user.status} />
              <Badge status={user.kycStatus} label={`KYC ${user.kycStatus}`} />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={user.status === "Active" ? "danger" : "primary"}
                size="sm"
                icon={user.status === "Active" ? Lock : Unlock}
                disabled={actionLoading}
                onClick={handleToggleBlock}
              >
                {user.status === "Active" ? "Block Account" : "Unblock Account"}
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        {/* Top Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-amber-50 text-amber-900 border border-amber-300 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* 1. Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              {/* Profile Avatar & User Header Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 via-white to-amber-50/40 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="relative shrink-0">
                  {user.profileImage ? (
                    <img
                      src={getMediaUrl(user.profileImage)}
                      alt={user.fullName || user.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-sm"
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextElementSibling) {
                          e.target.nextElementSibling.style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center shadow-xs ${
                      user.profileImage ? "hidden" : "flex"
                    }`}
                  >
                    <User className="w-8 h-8 text-slate-400" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      {user.fullName || user.name}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 font-bold border border-amber-200">
                      {user.id}
                    </span>
                    <Badge status={user.status} size="sm" />
                    <Badge status={user.kycStatus} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {user.email || "No email registered"} ·{" "}
                    {user.mobile || "No mobile registered"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Registered on {formatDate(user.createdAt, true)} ·{" "}
                    {user.role || "Individual"} Account
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-400" /> Full Legal Name
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {user.fullName || user.name}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-slate-400" /> Customer ID
                  </p>
                  <p className="text-sm font-mono font-bold text-amber-800 mt-1">
                    {user.id}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" /> Mobile Number
                  </p>
                  <p className="text-sm font-mono font-semibold text-slate-900 mt-1">
                    {user.mobile || "—"}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" /> Email Address
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 break-all">
                    {user.email || "—"}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" /> Date of
                    Birth
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {user.dob ? formatDate(user.dob) : "Not specified"}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">
                    Gender & Nationality
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 capitalize">
                    {user.gender || "Not specified"} ·{" "}
                    {user.nationality || "Indian"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[11px] text-slate-500 uppercase font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-400" /> Residential
                  Address
                </p>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                  {user.address || "Address details not provided."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">
                    User's Referral Code
                  </p>
                  <p className="text-xs font-mono font-bold text-amber-800 mt-1">
                    {user.referralCode || "None"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Code to invite new friends
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">
                    Profile Status
                  </p>
                  <p
                    className={`text-xs font-semibold mt-1 ${user.isProfileComplete ? "text-emerald-700" : "text-slate-600"}`}
                  >
                    {user.isProfileComplete
                      ? "✓ Profile Completed"
                      : "Profile Incomplete"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Account setup status
                  </p>
                </div>
              </div>

              {/* Referred By & Referral Reward Details Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-600" />
                    Referral Source & Inviter Details
                  </span>
                  {user.referralInfo?.hasReferral ? (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        user.referralInfo.status === "REWARDED" ||
                        user.referralInfo.status === "SUCCESSFUL"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : user.referralInfo.status === "EXPIRED"
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {user.referralInfo.status === "REWARDED" ||
                      user.referralInfo.status === "SUCCESSFUL"
                        ? "✓ Reward Credited"
                        : user.referralInfo.status === "EXPIRED"
                          ? "Expired"
                          : "⏳ Reward Pending"}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      Direct Signup (No Referral)
                    </span>
                  )}
                </div>

                {user.referralInfo?.hasReferral ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Referrer Contact Card */}
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                      <p className="text-[10px] text-amber-900 font-bold uppercase tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3 text-amber-700" /> Referrer
                        Contact
                      </p>
                      <p className="font-extrabold text-slate-900 text-sm">
                        {user.referralInfo.referrerName}
                      </p>
                      <p className="font-mono text-xs text-slate-700 font-semibold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {user.referralInfo.referrerMobile}
                      </p>
                      {user.referralInfo.referrerEmail &&
                        user.referralInfo.referrerEmail !== "—" && (
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {user.referralInfo.referrerEmail}
                          </p>
                        )}
                    </div>

                    {/* Referral Code Used & Reward Card */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" /> Code Used &
                        Reward Status
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">
                          Referral Code:
                        </span>
                        <span className="font-mono font-bold text-amber-800 text-xs px-2 py-0.5 rounded bg-amber-100 border border-amber-200">
                          {user.referralInfo.referralCodeUsed}
                        </span>
                      </div>
                      <div className="pt-1 border-t border-slate-200">
                        <span className="text-[10px] text-slate-400 block">
                          Referral Reward:
                        </span>
                        <p
                          className={`font-extrabold text-xs sm:text-sm ${
                            user.referralInfo.status === "REWARDED" ||
                            user.referralInfo.status === "SUCCESSFUL"
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          {user.referralInfo.rewardText}
                        </p>
                      </div>
                      {user.referralInfo.rewardedAt && (
                        <p className="text-[10px] text-slate-400 pt-0.5">
                          Dispatched on{" "}
                          {formatDate(user.referralInfo.rewardedAt, true)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-1">
                    This user registered directly without entering any friend's
                    referral code.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 2. KYC Info Tab */}
          {activeTab === "kyc" && (
            <div className="space-y-4">
              {/* KYC Status & Quick Action Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">
                    KYC Verification Status
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge status={user.kycStatus} size="md" />
                    {user.kycDocuments?.submittedAt && (
                      <span className="text-[11px] text-slate-400">
                        Submitted{" "}
                        {formatDate(user.kycDocuments.submittedAt, true)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.kycStatus !== "Verified" && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle2}
                      disabled={actionLoading}
                      onClick={() => handleKycStatusUpdate("Verified")}
                    >
                      Approve KYC
                    </Button>
                  )}

                  {user.kycStatus !== "Rejected" && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      disabled={actionLoading}
                      onClick={() => handleKycStatusUpdate("Rejected")}
                    >
                      Reject KYC
                    </Button>
                  )}
                </div>
              </div>

              {/* Rejection notice if any */}
              {user.rejectionReason && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Rejection Reason: </span>
                    <span>{user.rejectionReason}</span>
                  </div>
                </div>
              )}

              {/* Real PAN Card Details (NO mock Aadhaar number) */}
              <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                <p className="text-xs text-slate-500 font-semibold uppercase">
                  PAN Card Number
                </p>
                <p className="text-base font-mono font-extrabold text-slate-900 mt-1 tracking-wider">
                  {user.panNumber || "Not provided"}
                </p>
                {user.panNumber && (
                  <p className="text-[10px] text-emerald-700 font-medium mt-1">
                    Permanent Account Number verified
                  </p>
                )}
              </div>

              {/* Uploaded Documents Gallery with Click to View Preview */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  Uploaded KYC Documents
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {kycDocs.map((doc) => {
                    const fullMediaUrl = getMediaUrl(doc.path);

                    return (
                      <div
                        key={doc.id}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs flex flex-col justify-between"
                      >
                        {fullMediaUrl ? (
                          <div
                            onClick={() =>
                              setPreviewImage({
                                url: fullMediaUrl,
                                title: doc.title,
                              })
                            }
                            className="relative group h-36 bg-slate-100 cursor-pointer overflow-hidden border-b border-slate-100"
                          >
                            <img
                              src={fullMediaUrl}
                              alt={doc.title}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.innerHTML =
                                  '<div class="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center text-xs"><FileText class="w-8 h-8 mb-1 text-slate-300" /><span>Preview unavailable</span></div>';
                              }}
                            />
                            <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold backdrop-blur-xs">
                              <Eye className="w-4 h-4" />
                              <span>Click to View</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-36 bg-slate-50 border-b border-slate-100 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <FileText className="w-8 h-8 mb-1 text-slate-300" />
                            <span className="text-xs font-medium text-slate-400">
                              Not Uploaded
                            </span>
                          </div>
                        )}

                        <div className="p-3">
                          <p className="text-xs font-bold text-slate-900 leading-snug">
                            {doc.title}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {doc.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. Bank & UPI Accounts Tab */}
          {activeTab === "bank" && (
            <div className="space-y-4">
              {/* Bank Accounts Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-amber-600" />
                  Linked Bank Accounts ({user.bankAccounts?.length || 0})
                </h4>

                {!user.bankAccounts || user.bankAccounts.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-700">
                      No bank accounts linked
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      This user has not linked any bank accounts for payout or
                      liquidation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {user.bankAccounts.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 capitalize">
                              {b.bankName}
                            </span>
                            {b.isPrimary && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md border border-amber-200">
                                Primary Account
                              </span>
                            )}
                            <Badge
                              status={
                                b.verificationStatus === "verified"
                                  ? "Verified"
                                  : "Pending"
                              }
                              size="sm"
                            />
                          </div>

                          <p className="text-xs font-mono font-semibold text-slate-700">
                            A/C:{" "}
                            <span className="font-bold text-slate-900">
                              {b.accountNumberLast4}
                            </span>
                            <span className="text-slate-400 mx-2">·</span>
                            IFSC:{" "}
                            <span className="font-bold text-slate-900 uppercase">
                              {b.ifsc}
                            </span>
                          </p>

                          <p className="text-[11px] text-slate-500">
                            Beneficiary:{" "}
                            <span className="font-semibold text-slate-700">
                              {b.accountHolderName}
                            </span>
                            <span className="text-slate-400 mx-1.5">·</span>
                            Type:{" "}
                            <span className="capitalize text-slate-600">
                              {b.accountType}
                            </span>
                          </p>
                        </div>

                        <div className="text-right sm:border-l sm:border-slate-100 sm:pl-4">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            Added On
                          </span>
                          <p className="text-xs text-slate-600">
                            {formatDate(b.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* UPI IDs Section */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-amber-600" />
                  UPI Handles ({user.upiAccounts?.length || 0})
                </h4>

                {!user.upiAccounts || user.upiAccounts.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    No UPI handles registered yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user.upiAccounts.map((upi, i) => (
                      <div
                        key={upi.id || i}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-mono font-extrabold text-slate-900 tracking-wide">
                            {upi.upiId}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {upi.provider} ·{" "}
                            {upi.isPrimary ? "Primary VPA" : "Linked VPA"}
                          </p>
                        </div>
                        <Badge
                          status={
                            upi.status === "verified" ? "Verified" : "Active"
                          }
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Asset Holdings Tab */}
          {activeTab === "wallet" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 shadow-xs">
                  <p className="text-xs text-amber-900 font-bold uppercase">
                    Gold Vault Balance
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1.5">
                    {formatGrams(user.goldBalance || 0)}
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums mt-1 font-medium">
                    24K 999 Fine Gold Custody
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-600 font-bold uppercase">
                    Silver Vault Balance
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1.5">
                    {formatGrams(user.silverBalance || 0)}
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums mt-1 font-medium">
                    999 Pure Silver Custody
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-600 font-bold uppercase">
                    Total Invested
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1.5">
                    {formatINR(user.totalInvested || 0)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Lifetime bullion buy value
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  All physical metal is 100% insured and vaulted in
                  institutional BRINKS / Sequel security vaults.
                </span>
              </div>
            </div>
          )}

          {/* 5. Referrals Tab */}
          {activeTab === "referrals" && (
            <div className="space-y-4">
              {/* Referral Code Banner */}
              <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">
                      Referral Code
                    </p>
                    <p className="text-sm font-mono font-bold text-amber-800">
                      {referralData?.referralCode || user.referralCode || "—"}
                    </p>
                  </div>
                </div>
                {referralData?.stats?.totalRewardAmount > 0 && (
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">
                      Cash Rewards
                    </p>
                    <p className="text-sm font-bold text-slate-900 tabular-nums">
                      {formatINR(referralData.stats.totalRewardAmount)}
                    </p>
                  </div>
                )}
              </div>

              {/* Loading State */}
              {referralLoading && (
                <div className="space-y-2.5">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-slate-50 border border-slate-100 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              )}

              {/* Error State */}
              {!referralLoading && referralError && (
                <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <AlertTriangle className="w-7 h-7 text-rose-500 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-rose-800">
                    {referralError}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={RefreshCw}
                    className="mt-3"
                    onClick={() => fetchReferrals(user.rawId || user.id)}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Empty State */}
              {!referralLoading &&
                !referralError &&
                referralData &&
                referralData.referrals.length === 0 && (
                  <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <Users className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">
                      No referrals yet
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                      {user.fullName || user.name} has not invited any users who
                      signed up with their referral code yet.
                    </p>
                  </div>
                )}

              {/* Referred Users List */}
              {!referralLoading &&
                !referralError &&
                referralData &&
                referralData.referrals.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-600" />
                      Referred Friends ({referralData.referrals.length})
                    </h4>
                    <div className="space-y-2.5">
                      {referralData.referrals.map((r) => {
                        const isSuccessful =
                          r.status === "SUCCESSFUL" || r.status === "REWARDED";
                        const statusBadge = isSuccessful
                          ? {
                              label: "Successful",
                              cls: "bg-emerald-100 text-emerald-800 border-emerald-300",
                            }
                          : r.status === "EXPIRED"
                            ? {
                                label: "Expired",
                                cls: "bg-slate-100 text-slate-600 border-slate-200",
                              }
                            : {
                                label: "Pending",
                                cls: "bg-amber-100 text-amber-800 border-amber-300",
                              };

                        return (
                          <div
                            key={r.id}
                            className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                                {r.profileImage ? (
                                  <img
                                    src={getMediaUrl(r.profileImage)}
                                    alt={r.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      if (e.target.nextElementSibling)
                                        e.target.nextElementSibling.style.display =
                                          "flex";
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`w-full h-full items-center justify-center text-slate-400 ${r.profileImage ? "hidden" : "flex"}`}
                                >
                                  <User className="w-5 h-5" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-slate-900 truncate">
                                    {r.name}
                                  </p>
                                  {r.referredUserId && (
                                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-900 font-bold border border-amber-200 shrink-0">
                                      {r.referredUserId}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {r.mobile} · {r.email}
                                </p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  Joined {formatDate(r.joinedAt)}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.cls}`}
                              >
                                {statusBadge.label}
                              </span>
                              <p
                                className={`text-[11px] font-semibold ${isSuccessful ? "text-emerald-700" : "text-slate-500"}`}
                              >
                                {r.rewardText}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </Drawer>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {previewImage.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {user.name} ({user.id})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-100 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
