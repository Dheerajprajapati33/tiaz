import React, { useState, useEffect, useRef } from "react";
import Card from "../components/common/Card.jsx";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";
import HtmlEditor from "../components/common/HtmlEditor.jsx";
import { useAuthStore } from "../store/authStore.js";
import { useToast } from "../components/common/Toast.jsx";
import {
  adminProfileApi,
  contentApi,
  getMediaUrl,
  rateSettingsApi,
  bullionApi,
} from "../services/api.js";
import {
  User,
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  Lock,
  FileText,
  ShieldAlert,
  Camera,
  Upload,
  RefreshCw,
  Building2,
  ShieldCheck,
  AlertCircle,
  Sliders,
  Percent,
  TrendingUp,
  Coins,
  Disc,
  Save,
  Sparkles,
  Info,
  Gift,
  Wallet,
  Check,
} from "lucide-react";

// Format Admin ID helper (e.g. RAJ-89C1)
const formatAdminDisplayId = (admin) => {
  if (!admin) return "ADM-001";
  if (admin.id && admin.id.length < 15 && admin.id.includes("-")) {
    return admin.id;
  }
  const name = admin.name || admin.fullName || "Admin";
  const prefix = (
    name.replace(/[^a-zA-Z]/g, "").slice(0, 3) || "ADM"
  ).toUpperCase();
  const rawId = String(admin.rawId || admin._id || admin.id || "0000");
  const suffix = rawId.slice(-4).toUpperCase();
  return `${prefix}-${suffix}`;
};

// Format Last Login timestamp helper (e.g. 30 Sep 2026, 02:05 PM)
const formatDisplayDate = (dateVal) => {
  if (!dateVal) return "Just now";
  if (
    typeof dateVal === "string" &&
    !dateVal.includes("T") &&
    !dateVal.includes("Z")
  ) {
    return dateVal;
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("rateSettings"); // 'rateSettings' | 'profile' | 'terms' | 'privacy'
  const { adminUser, updateProfile } = useAuthStore();
  const { addToast } = useToast();

  const fileInputRef = useRef(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: adminUser?.name || adminUser?.fullName || "Rajesh Varma",
    email: adminUser?.email || "admin@tiaz.com",
    phone: adminUser?.phone || adminUser?.mobile || "+91 98200 11990",
    department: adminUser?.department || "Risk & Custody Operations",
    profileImage: adminUser?.profileImage || adminUser?.avatar || null,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Change Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Terms and Privacy Content State
  const [termsContent, setTermsContent] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Bullion Dynamic Rate Settings State
  const [rateSettingsForm, setRateSettingsForm] = useState({
    goldBuyMarkupPercent: 5.0,
    goldSellDiscountPercent: 0.0,
    silverBuyMarkupPercent: 5.0,
    silverSellDiscountPercent: 0.0,
    gstPercent: 3.0,
  });
  const [liveBenchmarks, setLiveBenchmarks] = useState({
    gold24k: 15028,
    silver999: 235,
  });
  const [isLoadingRateSettings, setIsLoadingRateSettings] = useState(false);
  const [isSavingRateSettings, setIsSavingRateSettings] = useState(false);

  // Referral Program Reward Settings State
  const [referralRewardForm, setReferralRewardForm] = useState({
    referralRewardEnabled: true,
    referralRewardType: "CASH",
    referralRewardAmount: 51,
  });
  const [isSavingReferral, setIsSavingReferral] = useState(false);

  // Load Bullion Rate Settings & Live Benchmarks
  const loadRateSettings = async () => {
    setIsLoadingRateSettings(true);
    try {
      const [rateRes, goldRes, silverRes] = await Promise.allSettled([
        rateSettingsApi.getRateSettings(),
        bullionApi.getGoldOverview(),
        bullionApi.getSilverOverview(),
      ]);

      if (
        rateRes.status === "fulfilled" &&
        rateRes.value?.success &&
        rateRes.value?.data
      ) {
        const s = rateRes.value.data;
        setRateSettingsForm({
          goldBuyMarkupPercent: s.goldBuyMarkupPercent ?? 5.0,
          goldSellDiscountPercent: s.goldSellDiscountPercent ?? 0.0,
          silverBuyMarkupPercent: s.silverBuyMarkupPercent ?? 5.0,
          silverSellDiscountPercent: s.silverSellDiscountPercent ?? 0.0,
          gstPercent: s.gstPercent ?? 3.0,
        });
        setReferralRewardForm({
          referralRewardEnabled: s.referralRewardEnabled !== false,
          referralRewardType: s.referralRewardType || "CASH",
          referralRewardAmount: s.referralRewardAmount ?? 51,
        });
      }

      let goldPrice = 15028;
      let silverPrice = 235;
      if (
        goldRes.status === "fulfilled" &&
        goldRes.value?.success &&
        goldRes.value?.data
      ) {
        goldPrice =
          goldRes.value.data?.rates?.actualPricePerGram ||
          goldRes.value.data?.purityRates?.[0]?.actualRate ||
          15028;
      }
      if (
        silverRes.status === "fulfilled" &&
        silverRes.value?.success &&
        silverRes.value?.data
      ) {
        silverPrice =
          silverRes.value.data?.rates?.actualPricePerGram ||
          silverRes.value.data?.purityRates?.[0]?.actualRate ||
          235;
      }
      setLiveBenchmarks({ gold24k: goldPrice, silver999: silverPrice });
    } catch (err) {
      console.error("Error fetching rate settings:", err);
    } finally {
      setIsLoadingRateSettings(false);
    }
  };

  useEffect(() => {
    loadRateSettings();
  }, []);

  const handleSaveRateSettings = async (e) => {
    e?.preventDefault();
    setIsSavingRateSettings(true);
    try {
      const payload = {
        goldBuyMarkupPercent:
          parseFloat(rateSettingsForm.goldBuyMarkupPercent) || 0,
        goldSellDiscountPercent:
          parseFloat(rateSettingsForm.goldSellDiscountPercent) || 0,
        silverBuyMarkupPercent:
          parseFloat(rateSettingsForm.silverBuyMarkupPercent) || 0,
        silverSellDiscountPercent:
          parseFloat(rateSettingsForm.silverSellDiscountPercent) || 0,
        gstPercent: parseFloat(rateSettingsForm.gstPercent) || 0,
      };
      const res = await rateSettingsApi.updateRateSettings(payload);
      if (res.success) {
        addToast(
          "Bullion rate settings updated successfully! New rates are now active.",
          "success",
        );
      } else {
        throw new Error(res.message || "Failed to update rate settings");
      }
    } catch (err) {
      console.error("Save rate settings error:", err);
      addToast(err.message || "Failed to update rate settings", "error");
    } finally {
      setIsSavingRateSettings(false);
    }
  };

  // Save Referral Program Reward Settings
  const handleSaveReferralReward = async (e) => {
    e?.preventDefault();
    setIsSavingReferral(true);
    try {
      const payload = {
        referralRewardEnabled: Boolean(
          referralRewardForm.referralRewardEnabled,
        ),
        referralRewardType: referralRewardForm.referralRewardType,
        referralRewardAmount:
          parseFloat(referralRewardForm.referralRewardAmount) || 0,
      };
      const res = await rateSettingsApi.updateRateSettings(payload);
      if (res.success) {
        addToast(
          "Referral reward configuration saved successfully! New users registered with a referral code will now credit this reward.",
          "success",
        );
      } else {
        throw new Error(
          res.message || "Failed to update referral reward settings",
        );
      }
    } catch (err) {
      console.error("Save referral reward error:", err);
      addToast(
        err.message || "Failed to update referral reward settings",
        "error",
      );
    } finally {
      setIsSavingReferral(false);
    }
  };

  // Load Admin Profile from API on mount
  useEffect(() => {
    async function loadProfile() {
      setIsLoadingProfile(true);
      try {
        const res = await adminProfileApi.getProfile();
        if (res.success && res.data) {
          const profile = res.data;
          setProfileForm({
            name: profile.name || profile.fullName || "Rajesh Varma",
            email: profile.email || "admin@tiaz.com",
            phone: profile.phone || profile.mobile || "+91 98200 11990",
            department: profile.department || "Risk & Custody Operations",
            profileImage: profile.profileImage || null,
          });
          updateProfile(profile);
        }
      } catch (err) {
        console.error("Error fetching admin profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadProfile();
  }, [updateProfile]);

  // Load Content for Terms and Privacy
  useEffect(() => {
    async function loadContent() {
      if (activeTab === "terms" && !termsContent) {
        setIsLoadingContent(true);
        try {
          const res = await contentApi.getContent("terms");
          if (res.success && res.data) {
            setTermsContent(res.data.content || "");
          }
        } catch (err) {
          console.error("Error fetching terms:", err);
          addToast("Failed to load Terms and Conditions", "error");
        } finally {
          setIsLoadingContent(false);
        }
      } else if (activeTab === "privacy" && !privacyContent) {
        setIsLoadingContent(true);
        try {
          const res = await contentApi.getContent("privacy");
          if (res.success && res.data) {
            setPrivacyContent(res.data.content || "");
          }
        } catch (err) {
          console.error("Error fetching privacy policy:", err);
          addToast("Failed to load Privacy Policy", "error");
        } finally {
          setIsLoadingContent(false);
        }
      }
    }

    loadContent();
  }, [activeTab, termsContent, privacyContent, addToast]);

  // Handle Profile Picture File Change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        addToast("Please select a valid image file (JPG, PNG, WEBP)", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        addToast("Image size cannot exceed 5 MB", "error");
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Submit Profile Changes
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      let data;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("fullName", profileForm.name);
        formData.append("mobile", profileForm.phone);
        formData.append("department", profileForm.department);
        formData.append("profileImage", selectedFile);
        data = formData;
      } else {
        data = {
          fullName: profileForm.name,
          mobile: profileForm.phone,
          department: profileForm.department,
        };
      }

      const res = await adminProfileApi.updateProfile(data);
      if (res.success && res.data) {
        updateProfile(res.data);
        setProfileForm((prev) => ({
          ...prev,
          name: res.data.name || res.data.fullName,
          phone: res.data.phone || res.data.mobile,
          department: res.data.department,
          profileImage: res.data.profileImage,
        }));
        setSelectedFile(null);
        setPreviewUrl(null);
        addToast("Administrator profile updated successfully", "success");
      } else {
        throw new Error(res.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      addToast(err.message || "Error updating administrator profile", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Submit Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      addToast("Current password is required", "error");
      return;
    }

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      addToast("New password must be at least 6 characters long", "error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast("New password and confirm password do not match", "error");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      addToast("New password cannot be the same as current password", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await adminProfileApi.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword,
      );

      if (res.success) {
        addToast(
          res.message || "Administrator password changed successfully",
          "success",
        );
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        throw new Error(res.message || "Failed to update password");
      }
    } catch (err) {
      console.error("Password change error:", err);
      addToast(
        err.message || "Incorrect password or validation error",
        "error",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Save Terms and Conditions
  const handleSaveTerms = async (html) => {
    try {
      const res = await contentApi.saveContent(
        "terms",
        html,
        "Terms and Conditions",
      );
      if (res.success) {
        setTermsContent(html);
        addToast("Terms and Conditions updated successfully", "success");
      } else {
        throw new Error(res.message || "Failed to save terms");
      }
    } catch (err) {
      console.error("Save terms error:", err);
      addToast(err.message || "Failed to save Terms and Conditions", "error");
    }
  };

  // Save Privacy Policy
  const handleSavePrivacy = async (html) => {
    try {
      const res = await contentApi.saveContent(
        "privacy",
        html,
        "Privacy Policy",
      );
      if (res.success) {
        setPrivacyContent(html);
        addToast("Privacy Policy updated successfully", "success");
      } else {
        throw new Error(res.message || "Failed to save privacy policy");
      }
    } catch (err) {
      console.error("Save privacy error:", err);
      addToast(err.message || "Failed to save Privacy Policy", "error");
    }
  };

  const tabs = [
    {
      id: "rateSettings",
      label: "Rate Settings (Buy/Sell & GST)",
      icon: Sliders,
    },
    { id: "referralReward", label: "Referral Reward", icon: Gift },
    { id: "profile", label: "Profile", icon: User },
    { id: "terms", label: "Terms and Conditions", icon: FileText },
    { id: "privacy", label: "Privacy Policy", icon: ShieldAlert },
  ];

  // Resolve current avatar display URL
  const currentAvatarUrl =
    previewUrl ||
    getMediaUrl(
      profileForm.profileImage || adminUser?.profileImage || adminUser?.avatar,
    );

  const adminName = profileForm.name || adminUser?.name || "Rajesh Varma";
  const initials =
    adminName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "RV";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Settings & Policies</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage administrator profile credentials, platform legal contracts,
          and privacy compliance.
        </p>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4 text-amber-700" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Profile Tab */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Top Banner Card */}
          <Card bodyClassName="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Profile Avatar with Camera Trigger */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#E6C352] via-[#D4AF37] to-[#A68316] p-[2px] shadow-[0_4px_14px_rgba(212,175,55,0.35)] overflow-hidden">
                  {currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt={adminName}
                      className="w-full h-full rounded-[14px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center font-bold text-2xl text-[#E6C352]">
                      {initials}
                    </div>
                  )}
                </div>

                {/* Quick Upload Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-900 border-2 border-white shadow-md transition-transform hover:scale-105 cursor-pointer"
                  title="Upload profile picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    {adminName}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono w-fit mx-auto sm:mx-0">
                    {adminUser?.role || "Super Administrator"}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Department:{" "}
                  <span className="text-slate-900 font-semibold">
                    {profileForm.department}
                  </span>
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-500">
                  <span className="font-mono font-medium">
                    ID: {formatAdminDisplayId(adminUser)}
                  </span>
                  <span>·</span>
                  <span>
                    Last Login:{" "}
                    {formatDisplayDate(
                      adminUser?.lastLogin || adminUser?.lastLoginAt,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information Form */}
            <Card
              title="Personal Information"
              subtitle="Update primary administrative contact details"
              bodyClassName="p-5"
            >
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                {/* Profile Picture Uploader Banner */}
                <div className="p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 overflow-hidden">
                      {currentAvatarUrl ? (
                        <img
                          src={currentAvatarUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Administrator Avatar
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedFile
                          ? selectedFile.name
                          : "PNG, JPG, or WEBP up to 5MB"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Upload}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? "Change" : "Upload"}
                  </Button>
                </div>

                <Input
                  label="Full Name"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  icon={User}
                  required
                />

                {/* Email Address - Strictly READ ONLY */}
                <div>
                  <Input
                    label="Admin Official Email (Read-Only)"
                    type="email"
                    value={profileForm.email}
                    disabled={true}
                    readOnly={true}
                    icon={Mail}
                    className="cursor-not-allowed opacity-90"
                    helperText="Official administrator email is locked and cannot be edited."
                  />
                </div>

                <Input
                  label="Authorized Phone Number"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  icon={Phone}
                  required
                />

                <Input
                  label="Department / Desk"
                  value={profileForm.department}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      department: e.target.value,
                    })
                  }
                  icon={Building2}
                  required
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isUpdatingProfile}
                    icon={isUpdatingProfile ? RefreshCw : null}
                  >
                    {isUpdatingProfile
                      ? "Saving Changes..."
                      : "Save Profile Changes"}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Change Password Form */}
            <Card
              title="Change Password"
              subtitle="Update your administrator login credentials"
              bodyClassName="p-5"
            >
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="Enter current password"
                  icon={Lock}
                  required
                />

                <Input
                  label="New Password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Enter new password"
                  icon={KeyRound}
                  helperText="Must be at least 6 characters"
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                  icon={KeyRound}
                  required
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="outline"
                    size="md"
                    disabled={isChangingPassword}
                    icon={isChangingPassword ? RefreshCw : null}
                  >
                    {isChangingPassword
                      ? "Updating Password..."
                      : "Update Password"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Security Privileges Card */}
          <Card
            title="Administrative Permissions & Compliance Access"
            subtitle="Role-based access matrix assigned to this account"
            bodyClassName="p-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between shadow-xs">
                <div>
                  <p className="font-bold text-slate-900">
                    Bullion Purity & Rate Adjustment
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Permitted to manage spot and live benchmark feeds
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between shadow-xs">
                <div>
                  <p className="font-bold text-slate-900">
                    KYC Document Verification
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Full authority to approve, reject, or request re-upload
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between shadow-xs">
                <div>
                  <p className="font-bold text-slate-900">
                    IMPS Bank Payout Dispatch
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Ability to review gold/silver liquidation payouts
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between shadow-xs">
                <div>
                  <p className="font-bold text-slate-900">
                    Investor Account Freeze / Lock
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Emergency access control for suspicious customer activity
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 2. Terms and Conditions Tab */}
      {activeTab === "terms" && (
        <div className="space-y-4">
          {isLoadingContent ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Loading Terms and Conditions...
              </p>
            </div>
          ) : (
            <HtmlEditor
              title="Terms and Conditions"
              subtitle="HTML content rendered directly on client mobile apps and web platforms"
              value={termsContent}
              onSave={handleSaveTerms}
            />
          )}
        </div>
      )}

      {/* 3. Privacy Policy Tab */}
      {activeTab === "privacy" && (
        <div className="space-y-4">
          {isLoadingContent ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Loading Privacy Policy...
              </p>
            </div>
          ) : (
            <HtmlEditor
              title="Privacy Policy"
              subtitle="Privacy compliance and data protection terms rendered directly to users"
              value={privacyContent}
              onSave={handleSavePrivacy}
            />
          )}
        </div>
      )}

      {/* 4. Bullion Rate Settings Tab */}
      {activeTab === "rateSettings" && (
        <div className="space-y-6">
          {/* Header Card */}
          <Card bodyClassName="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-xs shrink-0">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Bullion Dynamic Rate Margins & GST Tax
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define custom platform markups, liquidation buy-back
                    discounts, and government GST applied to all customer
                    trades.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadRateSettings}
                disabled={isLoadingRateSettings}
                className="flex items-center gap-1.5 text-xs border-slate-200 shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingRateSettings ? "animate-spin text-amber-600" : ""}`}
                />
                <span>Refresh Rates</span>
              </Button>
            </div>
          </Card>

          {/* Form Grid */}
          <form onSubmit={handleSaveRateSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gold Margins Card */}
              <Card
                title="Gold Rate Margins (24K, 22K, 18K)"
                subtitle="Controls markup on buy and liquidation discount on sell"
                bodyClassName="p-6 space-y-4"
              >
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2.5 text-amber-900 text-xs">
                  <Coins className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Current Live 24K Benchmark:{" "}
                    <strong>
                      ₹
                      {liveBenchmarks.gold24k.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      /gm
                    </strong>
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gold Buy Markup Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="50"
                        value={rateSettingsForm.goldBuyMarkupPercent}
                        onChange={(e) =>
                          setRateSettingsForm({
                            ...rateSettingsForm,
                            goldBuyMarkupPercent: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="5.0"
                        required
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Added on top of live market rate when customers purchase
                      gold (Default: 5%).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gold Sell Discount Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="50"
                        value={rateSettingsForm.goldSellDiscountPercent}
                        onChange={(e) =>
                          setRateSettingsForm({
                            ...rateSettingsForm,
                            goldSellDiscountPercent: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="0.0"
                        required
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Deducted from live benchmark when customers sell gold (0%
                      = 100% fair benchmark payout).
                    </p>
                  </div>
                </div>
              </Card>

              {/* Silver Margins Card */}
              <Card
                title="Silver Rate Margins (999, 925, 900)"
                subtitle="Controls markup on buy and liquidation discount on sell"
                bodyClassName="p-6 space-y-4"
              >
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2.5 text-slate-800 text-xs">
                  <Disc className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Current Live 999 Benchmark:{" "}
                    <strong>
                      ₹
                      {liveBenchmarks.silver999.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      /gm
                    </strong>
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Silver Buy Markup Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="50"
                        value={rateSettingsForm.silverBuyMarkupPercent}
                        onChange={(e) =>
                          setRateSettingsForm({
                            ...rateSettingsForm,
                            silverBuyMarkupPercent: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="5.0"
                        required
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Added on top of live market rate when customers purchase
                      silver (Default: 5%).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Silver Sell Discount Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="50"
                        value={rateSettingsForm.silverSellDiscountPercent}
                        onChange={(e) =>
                          setRateSettingsForm({
                            ...rateSettingsForm,
                            silverSellDiscountPercent: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="0.0"
                        required
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Deducted from live benchmark when customers sell silver
                      (0% = 100% fair benchmark payout).
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* GST & Tax Compliance Card */}
            <Card
              title="Bullion Tax & GST Compliance"
              subtitle="Statutory tax applied uniformly across bullion invoices"
              bodyClassName="p-6"
            >
              <div className="max-w-md">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bullion GST Tax Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="28"
                    value={rateSettingsForm.gstPercent}
                    onChange={(e) =>
                      setRateSettingsForm({
                        ...rateSettingsForm,
                        gstPercent: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="3.0"
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Standard Indian Bullion GST levied on purchase orders
                  (Government standard is 3%).
                </p>
              </div>
            </Card>

            {/* Live Real-Time Calculation Simulator */}
            <Card
              title="Live Rate Simulation & Price Impact"
              subtitle="Calculated customer rates based on current live market feed and above margins"
              bodyClassName="p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gold Preview */}
                {(() => {
                  const goldMarkup =
                    parseFloat(rateSettingsForm.goldBuyMarkupPercent) || 0;
                  const goldDiscount =
                    parseFloat(rateSettingsForm.goldSellDiscountPercent) || 0;
                  const gst = parseFloat(rateSettingsForm.gstPercent) || 0;
                  const goldBuy =
                    Math.round(
                      liveBenchmarks.gold24k * (1 + goldMarkup / 100) * 100,
                    ) / 100;
                  const goldSell =
                    Math.round(
                      liveBenchmarks.gold24k * (1 - goldDiscount / 100) * 100,
                    ) / 100;
                  const goldBuyWithGst =
                    Math.round(goldBuy * (1 + gst / 100) * 100) / 100;

                  return (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                        <span className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-600" />
                          24K Gold Preview
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                          Live Active
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Live Benchmark:</span>
                          <span className="font-bold text-slate-900">
                            ₹
                            {liveBenchmarks.gold24k.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            /g
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Customer Buy (+{goldMarkup}%):</span>
                          <span className="font-extrabold text-slate-900">
                            ₹
                            {goldBuy.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            /g
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>With GST (+{gst}%):</span>
                          <span className="font-bold text-amber-800">
                            ₹
                            {goldBuyWithGst.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            /g
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 border-t border-amber-200/80 pt-1.5">
                          <span>Customer Sell (-{goldDiscount}%):</span>
                          <span className="font-extrabold text-emerald-700">
                            ₹
                            {goldSell.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            /g
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Silver Preview */}
                {(() => {
                  const silverMarkup =
                    parseFloat(rateSettingsForm.silverBuyMarkupPercent) || 0;
                  const silverDiscount =
                    parseFloat(rateSettingsForm.silverSellDiscountPercent) || 0;
                  const gst = parseFloat(rateSettingsForm.gstPercent) || 0;
                  const silverBuy =
                    Math.round(
                      liveBenchmarks.silver999 * (1 + silverMarkup / 100) * 100,
                    ) / 100;
                  const silverSell =
                    Math.round(
                      liveBenchmarks.silver999 *
                        (1 - silverDiscount / 100) *
                        100,
                    ) / 100;
                  const silverBuyWithGst =
                    Math.round(silverBuy * (1 + gst / 100) * 100) / 100;

                  return (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <Disc className="w-4 h-4 text-slate-600" />
                          999 Silver Preview
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded-full">
                          Live Active
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Live Benchmark:</span>
                          <span className="font-bold text-slate-900">
                            ₹
                            {liveBenchmarks.silver999.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            /g
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Customer Buy (+{silverMarkup}%):</span>
                          <span className="font-extrabold text-slate-900">
                            ₹
                            {silverBuy.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            /g
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>With GST (+{gst}%):</span>
                          <span className="font-bold text-slate-700">
                            ₹
                            {silverBuyWithGst.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            /g
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1.5">
                          <span>Customer Sell (-{silverDiscount}%):</span>
                          <span className="font-extrabold text-emerald-700">
                            ₹
                            {silverSell.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            /g
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Card>

            {/* Save Action Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingRateSettings}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {isSavingRateSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Rate Settings</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Referral Program Reward Settings Tab */}
      {activeTab === "referralReward" && (
        <div className="space-y-6">
          {/* Header Card */}
          <Card bodyClassName="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-xs shrink-0">
                  <Gift className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Referral & Invite Reward Settings
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        referralRewardForm.referralRewardEnabled
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}
                    >
                      {referralRewardForm.referralRewardEnabled
                        ? "Program Active"
                        : "Program Paused"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure the automatic reward credited into an existing
                    user's wallet when a new friend registers using their
                    referral code.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                  <span>Program Status:</span>
                  <input
                    type="checkbox"
                    checked={referralRewardForm.referralRewardEnabled}
                    onChange={(e) =>
                      setReferralRewardForm({
                        ...referralRewardForm,
                        referralRewardEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <span
                    className={`text-xs font-extrabold ${referralRewardForm.referralRewardEnabled ? "text-emerald-600" : "text-slate-400"}`}
                  >
                    {referralRewardForm.referralRewardEnabled
                      ? "ENABLED"
                      : "DISABLED"}
                  </span>
                </label>
              </div>
            </div>
          </Card>

          {/* Configuration Form */}
          <form onSubmit={handleSaveReferralReward} className="space-y-6">
            {/* Reward Type Selection */}
            <Card
              title="Reward Destination Wallet"
              subtitle="Select which wallet balance the referrer will receive their reward into"
              bodyClassName="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Option 1: Cash Wallet */}
                <div
                  onClick={() =>
                    setReferralRewardForm({
                      ...referralRewardForm,
                      referralRewardType: "CASH",
                    })
                  }
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    referralRewardForm.referralRewardType === "CASH"
                      ? "border-amber-500 bg-amber-50/60 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <Wallet className="w-5 h-5" />
                    </div>
                    {referralRewardForm.referralRewardType === "CASH" && (
                      <Check className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Tia'z Cash Wallet (INR ₹)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Direct cash balance added to the user's primary wallet. Can
                    be used to buy gold or silver.
                  </p>
                  <div className="mt-3 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Recommended (High Conversion)
                  </div>
                </div>

                {/* Option 2: 24K Gold Vault */}
                <div
                  onClick={() =>
                    setReferralRewardForm({
                      ...referralRewardForm,
                      referralRewardType: "GOLD",
                    })
                  }
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    referralRewardForm.referralRewardType === "GOLD"
                      ? "border-amber-500 bg-amber-50/60 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                      <Coins className="w-5 h-5" />
                    </div>
                    {referralRewardForm.referralRewardType === "GOLD" && (
                      <Check className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    24K Digital Gold (gm)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Free pure 24K Gold credited into the customer's vault
                    balance (e.g. 0.005 gm).
                  </p>
                  <div className="mt-3 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Gold Vault Asset
                  </div>
                </div>

                {/* Option 3: 999 Silver Vault */}
                <div
                  onClick={() =>
                    setReferralRewardForm({
                      ...referralRewardForm,
                      referralRewardType: "SILVER",
                    })
                  }
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    referralRewardForm.referralRewardType === "SILVER"
                      ? "border-amber-500 bg-amber-50/60 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                      <Disc className="w-5 h-5" />
                    </div>
                    {referralRewardForm.referralRewardType === "SILVER" && (
                      <Check className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    999 Fine Silver (gm)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Free 999 Silver credited into the customer's Silver vault
                    balance (e.g. 0.50 gm).
                  </p>
                  <div className="mt-3 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                    Silver Vault Asset
                  </div>
                </div>
              </div>

              {/* Reward Amount Input */}
              <div className="pt-4 border-t border-slate-200 max-w-md">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {referralRewardForm.referralRewardType === "CASH"
                    ? "Referral Cash Reward Amount (₹ INR)"
                    : referralRewardForm.referralRewardType === "GOLD"
                      ? "Referral 24K Gold Reward Weight (Grams)"
                      : "Referral 999 Silver Reward Weight (Grams)"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={
                      referralRewardForm.referralRewardType === "CASH"
                        ? "1"
                        : "0.0001"
                    }
                    min="0"
                    value={referralRewardForm.referralRewardAmount}
                    onChange={(e) =>
                      setReferralRewardForm({
                        ...referralRewardForm,
                        referralRewardAmount: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder={
                      referralRewardForm.referralRewardType === "CASH"
                        ? "51"
                        : "0.005"
                    }
                    required
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-500">
                    {referralRewardForm.referralRewardType === "CASH"
                      ? "₹ INR"
                      : "Grams"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {referralRewardForm.referralRewardType === "CASH"
                    ? "Recommended: ₹21 to ₹101 per successful user registration."
                    : "Recommended: 0.001 to 0.010 grams of 24K gold per registration."}
                </p>
              </div>
            </Card>

            {/* Live Example Simulation & Fraud Protection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Simulation Card */}
              <Card
                title="Live Reward Simulation"
                subtitle="How the reward executes during user registration"
                bodyClassName="p-5 space-y-3"
              >
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>When Friend Registers with Referral Code:</span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <p>1. Friend enters valid referral code during signup</p>
                    <p>
                      2. Backend validates that code exists and referrer is
                      active
                    </p>
                    <p>3. Registration completes and verified</p>
                    <p className="font-bold text-emerald-800 pt-1 border-t border-amber-200">
                      ➔ Referrer instantly receives:{" "}
                      <span className="underline">
                        {referralRewardForm.referralRewardType === "CASH"
                          ? `₹${parseFloat(referralRewardForm.referralRewardAmount) || 0} in Tia'z Wallet`
                          : `${parseFloat(referralRewardForm.referralRewardAmount) || 0}g ${
                              referralRewardForm.referralRewardType === "GOLD"
                                ? "24K Gold"
                                : "999 Silver"
                            } in Bullion Vault`}
                      </span>
                    </p>
                  </div>
                </div>
              </Card>

              {/* Anti-Fraud Protections Card */}
              <Card
                title="Active Anti-Fraud Safeguards"
                subtitle="Automated checks enforced by the backend API"
                bodyClassName="p-5 space-y-2 text-xs"
              >
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">
                      Valid Code Verification
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Non-existent codes are rejected with a 400 error
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">
                      Self-Referral Blocked
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Users cannot use their own phone number or code
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">
                      Suspended Account Check
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Blocked accounts cannot earn referral rewards
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">
                      1x Reward Idempotency
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Each registered user can only ever reward one referrer
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSavingReferral}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {isSavingReferral ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Referral Settings...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Referral Reward Settings</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
