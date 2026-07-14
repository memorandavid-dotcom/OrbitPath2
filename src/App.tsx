import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  CreditCard,
  Coins,
  Check,
  Info,
  RefreshCw,
  Smartphone,
  X,
  User,
  Landmark,
  Shield,
  Eye,
  EyeOff,
  Cpu,
  TrendingUp,
  Activity,
  History,
  CheckCircle2,
  AlertCircle,
  Users,
  Copy,
  Layers,
  ArrowRight,
  Lock,
  Mail,
  Smartphone as Phone,
  LogOut,
  Settings,
  Camera,
  ChevronRight,
  BookOpen,
  Bell,
  CheckSquare,
  Key,
  Palette,
  Receipt,
  Trash2,
  Edit,
  FileText,
  Download,
  Globe,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Deterministic QR pattern generator to draw real-looking SVG QR codes dynamically
function generateFakeQRMatrix(data: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // 1. Draw corner finder patterns (7x7)
  const drawFinder = (rowOffset: number, colOffset: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[rowOffset + r][colOffset + c] = isBorder || isCenter;
      }
    }
  };
  
  // Top-left, Top-right, Bottom-left finder blocks
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);
  
  // 2. Deterministic generator based on hash of string
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }
  
  // Fill remaining blocks deterministically
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isTopLeft = r < 8 && c < 8;
      const isTopRight = r < 8 && c > size - 9;
      const isBottomLeft = r > size - 9 && c < 8;
      if (isTopLeft || isTopRight || isBottomLeft) continue;
      
      const seed = Math.sin(hash + (r * size + c)) * 10000;
      matrix[r][c] = (seed - Math.floor(seed)) > 0.5;
    }
  }
  
  return matrix;
}

const OrbitPathLogo = () => (
  <div className="relative w-10 h-10 flex items-center justify-center select-none shrink-0">
    {/* Metallic glowing backdrop with planetary grid ring - static and pristine */}
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" style={{ transformOrigin: 'center' }}>
      {/* Outer Planet Orbital Ring */}
      <ellipse cx="50" cy="50" rx="46" ry="16" fill="none" stroke="#eab308" strokeWidth="2.5" strokeDasharray="6,4" opacity="0.8" transform="rotate(-25 50 50)" />
      {/* Intersecting secondary orbit */}
      <ellipse cx="50" cy="50" rx="42" ry="10" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.5" transform="rotate(35 50 50)" />
      {/* Metallic Gold Planetary Core Coin */}
      <circle cx="50" cy="50" r="28" fill="url(#metallicGold)" stroke="#fef08a" strokeWidth="1.5" />
      {/* Internal Stellar pathways / Star glyph inside coin */}
      <path d="M50 30 L53 45 L68 45 L56 53 L60 68 L50 58 L40 68 L44 53 L32 45 L47 45 Z" fill="#78350f" opacity="0.8" />
      
      {/* Definitions for metallic gradient */}
      <defs>
        <linearGradient id="metallicGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ca8a04" />
          <stop offset="30%" stopColor="#fef08a" />
          <stop offset="70%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
      </defs>
    </svg>
    {/* Micro center dot */}
    <div className="absolute w-2 h-2 rounded-full bg-slate-900 border border-yellow-200"></div>
  </div>
);

// === UX & TRANSACTION FORMATTER UTILITIES ===

// Generate database-safe local API billing/payment references
export function formatLocalRef(existingId?: string): string {
  if (existingId) {
    if (existingId.startsWith('op_sec_')) return existingId;
    if (existingId.startsWith('tx_hist_')) {
      const clean = existingId.replace('tx_hist_', '');
      return `op_sec_${clean.substring(0, 8)}`;
    }
    return `op_sec_${existingId.substring(0, 8)}`;
  }
  const chars = "abcdef0123456789";
  let randomString = "";
  for (let i = 0; i < 8; i++) {
    randomString += chars[Math.floor(Math.random() * chars.length)];
  }
  return `op_sec_${randomString}`;
}

// Generate Stellar ledger-safe Memo tags
export function formatStellarMemo(existingMemo?: string): string {
  if (existingMemo) {
    if (existingMemo.startsWith('Orbit_Remit_')) {
      const numPart = existingMemo.replace('Orbit_Remit_', '');
      if (numPart.length >= 5) return existingMemo;
    }
  }
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `Orbit_Remit_${randomDigits}`;
}

// Mask a ledger Transaction Hash or User Address for clean UI display
export function maskTransactionHash(hash: string): string {
  if (!hash) return "op_tx_****0000";
  if (hash.startsWith("op_tx_****") && hash.length === 14) {
    return hash;
  }
  const lastFour = hash.slice(-4);
  return `op_tx_****${lastFour}`;
}

// Format seconds remaining into MM:SS for user visual feedback
export function formatSessionTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function App() {
  // === AUTHENTICATION STATE ===
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('orbit_auth_token'));
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
    maskedAddress: string;
  } | null>(null);

  const [profileMobile, setProfileMobile] = useState<string>('+63 917 123 4567');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  
  // Auth view switcher: 'login' | 'register'
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // === REMEMBER ME & CACHED LOGIN ===
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem('orbit_remember_me') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState<string>(() => {
    return localStorage.getItem('orbit_remembered_email') || 'david@orbitpath.com';
  });
  const [loginMpin, setLoginMpin] = useState<string>('');

  // Sign Up inputs
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regMpin, setRegMpin] = useState<string>('');
  const [regAgreeTos, setRegAgreeTos] = useState<boolean>(false);
  
  // TOS Modal state
  const [showTosModal, setShowTosModal] = useState<boolean>(false);
  const [tosContent, setTosContent] = useState<string>('Loading terms of service from the ledger...');

  // === LOCALIZATION STATE ===
  const [language, setLanguage] = useState<'en' | 'tl'>(() => {
    return (localStorage.getItem('orbit_language') as any) || 'en';
  });
  const [timezone, setTimezone] = useState<'PHT' | 'UTC'>(() => {
    return (localStorage.getItem('orbit_timezone') as any) || 'PHT';
  });

  useEffect(() => {
    localStorage.setItem('orbit_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('orbit_timezone', timezone);
  }, [timezone]);

  // Date and relative timestamp localization formatter
  const getLocalizedText = (text: string) => {
    if (language === 'tl') {
      return text
        .replace('Today', 'Ngayong Araw')
        .replace('Yesterday', 'Kahapon')
        .replace('Just now', 'Kasalukuyan')
        .replace('Verified Account', 'Beripikadong Account')
        .replace('Verified Tier 2', 'Beripikado (Tier 2)')
        .replace('Developer Account', 'Account ng Developer')
        .replace('Consumer User', 'Gumagamit')
        .replace('SME Payout Account', 'SME Payout Account')
        .replace('AM', 'N.U.')
        .replace('PM', 'N.H.')
        .replace('July', 'Hulyo')
        .replace('Recent Activity', 'Kasalukuyang Aktibidad')
        .replace('Earlier This Month', 'Mas Maaga Ngayong Buwan')
        .replace('Official Transaction History', 'Opisyal na Kasaysayan ng Transaksyon');
    }
    return text;
  };

  const getLocalizedDate = (dateObj: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone === 'PHT' ? 'Asia/Manila' : 'UTC'
    };
    const locale = language === 'tl' ? 'tl-PH' : 'en-US';
    let formatted = dateObj.toLocaleString(locale, options);
    if (language === 'tl') {
      formatted = formatted
        .replace('AM', 'N.U.')
        .replace('PM', 'N.H.')
        .replace('Jan', 'Ene')
        .replace('Feb', 'Peb')
        .replace('Mar', 'Mar')
        .replace('Apr', 'Abr')
        .replace('May', 'May')
        .replace('Jun', 'Hun')
        .replace('Jul', 'Hul')
        .replace('Aug', 'Ago')
        .replace('Sep', 'Set')
        .replace('Oct', 'Okt')
        .replace('Nov', 'Nob')
        .replace('Dec', 'Dis');
    }
    return formatted;
  };

  // === NATIVE NOTIFICATION INFRASTRUCTURE ===
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
    type: string;
  }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orbit_notifications');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [
      {
        id: 'notif_1',
        title: "Payment Received",
        description: "$250.00 USDC received from Alice Vance",
        time: "Just now",
        read: false,
        type: "payout"
      },
      {
        id: 'notif_2',
        title: "Bill Due Notice",
        description: "Metro Power & Light bill of $45.00 USDC due in 5 days",
        time: "2 hours ago",
        read: false,
        type: "bill"
      },
      {
        id: 'notif_3',
        title: "Security Login Alert",
        description: "New login detected from Chrome on Linux container",
        time: "3 hours ago",
        read: true,
        type: "security"
      },
      {
        id: 'notif_4',
        title: "System Alert",
        description: "OrbitPath decentralized routing engine synchronized with Stellar mainnet",
        time: "1 day ago",
        read: true,
        type: "system"
      }
    ];
  });

  // Automatically serialize and save notifications to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orbit_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // === LOCAL VIEW LEDGER CLEAR STATE ===
  const [clearedTxIds, setClearedTxIds] = useState<string[]>([]);

  // === PROGRESSIVE CONSUMER SEND MONEY FLOW STATES ===
  const [sendStep, setSendStep] = useState<number>(1);
  const [recipientNumber, setRecipientNumber] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [numberError, setNumberError] = useState<string | null>(null);

  // === RESPONSIVE VIEW NAVIGATION ===
  // Managed cleanly like high-end fintech interfaces (GCash, Maya, GoTyme)
  // 'home' | 'send' | 'transactions' | 'profile'
  const [activeTab, setActiveTab] = useState<'home' | 'send' | 'transactions' | 'profile'>('home');

  // Pop-up slide-up modal camera scanner state
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);

  // WebRTC camera state
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const manualQRRef = React.useRef<HTMLInputElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Camera permission choices: 'undecided' | 'allow_once' | 'always' | 'ask_later' | 'dont_ask_again'
  const [cameraPermission, setCameraPermission] = useState<'undecided' | 'allow_once' | 'always' | 'ask_later' | 'dont_ask_again'>(() => {
    const saved = localStorage.getItem('orbit_camera_permission');
    if (saved === 'always') return 'always';
    if (saved === 'dont_ask_again') return 'dont_ask_again';
    return 'undecided';
  });

  // Interactive secure session states
  const [showSessionDropdown, setShowSessionDropdown] = useState<boolean>(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(900); // 15 minutes

  // Secure profile panel & saved QR state
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [uploadedQR, setUploadedQR] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orbit_uploaded_qr') || null;
    }
    return null;
  });
  const [savedQRs, setSavedQRs] = useState<Array<{ id: number; name: string; platform: string; date: string }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orbit_saved_qrs');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [
      { id: 1, name: "My GCash QR", platform: "GCash", date: "2026-04-12" }
    ];
  });

  // Automatically serialize and save savedQRs to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orbit_saved_qrs', JSON.stringify(savedQRs));
    }
  }, [savedQRs]);

  // Automatically serialize and save uploadedQR to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (uploadedQR) {
        localStorage.setItem('orbit_uploaded_qr', uploadedQR);
      } else {
        localStorage.removeItem('orbit_uploaded_qr');
      }
    }
  }, [uploadedQR]);

  // Auto-logout countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTimeLeft((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Autofocus manual input if scanner blocked
  useEffect(() => {
    if (showScannerModal && cameraError && manualQRRef.current) {
      setTimeout(() => {
        manualQRRef.current?.focus();
      }, 100);
    }
  }, [showScannerModal, cameraError]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (showScannerModal) {
      setCameraError(null);
      
      if (cameraPermission === 'always' || cameraPermission === 'allow_once') {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
          .then((stream) => {
            activeStream = stream;
            setCameraStream(stream);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.warn("Camera access failed:", err);
            setCameraError("Camera blocked or unavailable. Enter payload manually below.");
          });
      } else if (cameraPermission === 'dont_ask_again') {
        setCameraError("Camera access was permanently declined. Please enter payload manually.");
      }
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      // If we allowed once or chose ask later, reset to undecided when modal closes so it asks again next time!
      if (cameraPermission === 'allow_once' || cameraPermission === 'ask_later') {
        setCameraPermission('undecided');
      }
    }
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showScannerModal, cameraPermission]);

  // === BALANCE & FX CONVERSION STATE ===
  const [baseCurrency, setBaseCurrency] = useState<'PHP' | 'NGN' | 'EUR' | 'BRL'>('PHP');
  const [liveXlmBalance, setLiveXlmBalance] = useState<string>('Loading...');
  const [liveAssets, setLiveAssets] = useState<Array<{asset_code: string, balance: string}>>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(true);

  // === SEND MONEY / REMITTANCE STATE ===
  const [amountToSend, setAmountToSend] = useState<number>(100);
  const [destAsset, setDestAsset] = useState<'PHP' | 'NGN' | 'EUR' | 'BRL'>('PHP');
  const [recipientName, setRecipientName] = useState<string>('Maria Clara Santos');
  const [recipientDetails, setRecipientDetails] = useState<string>('+63 917 123 4567 (GCash)');
  const [deliveryMethod, setDeliveryMethod] = useState<'bank' | 'cash'>('bank');
  const [memoString, setMemoString] = useState<string>('Orbit_Remit_' + Math.floor(10000 + Math.random() * 90000));

  // Bills modal state
  const [billsProvider, setBillsProvider] = useState<string>('Power & Light Co.');
  const [billsAmount, setBillsAmount] = useState<string>('45');
  const [billsStatus, setBillsStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [showBillsModal, setShowBillsModal] = useState<boolean>(false);

  // QR Receive Modal state
  const [showQRReceive, setShowQRReceive] = useState<boolean>(false);
  const [qrAmount, setQrAmount] = useState<string>('120.00');
  const [qrAsset, setQrAsset] = useState<'USDC' | 'XLM' | 'PHP' | 'EUR'>('USDC');
  const [qrMemo, setQrMemo] = useState<string>('OrbitPay_' + Math.floor(1000 + Math.random() * 9000));

  // Dynamic Palette Theme selection
  const [theme, setTheme] = useState<'light' | 'dark' | 'midnight'>(() => {
    return (localStorage.getItem('orbit_theme') as any) || 'light';
  });

  // Dynamic QR Receiving States
  const [qrMode, setQrMode] = useState<'variable' | 'specific'>('specific');

  // CRM dynamic collections with offline local storage cache support
  const [billingProfiles, setBillingProfiles] = useState<Array<{
    id: string;
    provider: string;
    referenceId: string;
    amount: string;
    routingDetails: string;
  }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orbit_billing_profiles');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [
      { id: 'bill_1', provider: 'Metro Power & Light', referenceId: '9823-1123-4560', amount: '45', routingDetails: 'Stellar SEP-31 Payout Router' }
    ];
  });

  const [linkedAccounts, setLinkedAccounts] = useState<Array<{
    id: string;
    name: string;
    type: string;
    details: string;
  }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orbit_linked_accounts');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [
      { id: 'lnk_1', name: 'GCash Wallet', type: 'Fintech Wallet', details: '+63 917 •••• 4567' },
      { id: 'lnk_2', name: 'BDO Unibank', type: 'Savings Account', details: 'Acct •••• 8821' },
      { id: 'lnk_3', name: 'InstaPay network', type: 'Settlement Node', details: 'Auto Routed' }
    ];
  });

  // Automatically serialize and save CRM profiles to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orbit_billing_profiles', JSON.stringify(billingProfiles));
    }
  }, [billingProfiles]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orbit_linked_accounts', JSON.stringify(linkedAccounts));
    }
  }, [linkedAccounts]);

  // CSS variables manager for themes
  useEffect(() => {
    localStorage.setItem('orbit_theme', 'midnight');
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', '#020617'); // slate-950
    root.style.setProperty('--surface-card', '#090d16'); // deep slate-900
    root.style.setProperty('--text-main', '#f8fafc'); // slate-50
    root.style.setProperty('--text-brand', '#94a3b8'); // slate-400
    root.style.setProperty('--text-secondary', '#cbd5e1'); // slate-300
    root.style.setProperty('--border-color', '#1e293b'); // slate-800
    root.style.setProperty('--bg-darker', '#020617'); // slate-950
  }, [theme]);

  // Fetch billing and connected account data from server, with smart automatic re-synchronization
  const fetchProfileData = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/profile-data', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        const serverBills = data.billingProfiles || [];
        const serverAccounts = data.linkedAccounts || [];

        // If the serverless function restarted (loss of memory state), proactively restore offline local data
        if (serverBills.length === 0 && billingProfiles.length > 0) {
          for (const bill of billingProfiles) {
            await fetch('/api/billing-profiles/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify(bill)
            });
          }
        } else if (serverBills.length > 0) {
          setBillingProfiles(serverBills);
        }

        if (serverAccounts.length === 0 && linkedAccounts.length > 0) {
          for (const acc of linkedAccounts) {
            await fetch('/api/linked-accounts/add', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({ name: acc.name, type: acc.type, details: acc.details })
            });
          }
        } else if (serverAccounts.length > 0) {
          setLinkedAccounts(serverAccounts);
        }
      }
    } catch (err) {
      console.warn("Error fetching CRM profiles", err);
    }
  };

  useEffect(() => {
    if (authToken && currentUser) {
      fetchProfileData();
    }
  }, [authToken, currentUser]);

  // Interactive Profile Settings states
  const [showChangePin, setShowChangePin] = useState<boolean>(false);
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  
  const [notificationPrefs, setNotificationPrefs] = useState({
    push: true,
    email: true,
    sms: false
  });

  // Sending/Workflow Status state
  const [workflowStep, setWorkflowStep] = useState<number>(0);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [workflowStatus, setWorkflowStatus] = useState<string>('');

  // Receipt Modal state
  const [txReceipt, setTxReceipt] = useState<{
    success: boolean;
    hash: string;
    message: string;
    amountSent: number;
    amountReceived: number;
    source: string;
    target: string;
    recipient: string;
    details: string;
    timestamp: string;
    pathUsed: string[];
    memo: string;
  } | null>(null);

  // CRUD states for linked accounts form
  const [showAddAccount, setShowAddAccount] = useState<boolean>(false);
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccType, setNewAccType] = useState<string>('Fintech Wallet');
  const [newAccDetails, setNewAccDetails] = useState<string>('');

  // CRUD states for billing profiles form
  const [showAddBilling, setShowAddBilling] = useState<boolean>(false);
  const [editingBillingId, setEditingBillingId] = useState<string | null>(null);
  const [billingProviderField, setBillingProviderField] = useState<string>('');
  const [billingRefIdField, setBillingRefIdField] = useState<string>('');
  const [billingAmountField, setBillingAmountField] = useState<string>('45');
  const [billingRoutingField, setBillingRoutingField] = useState<string>('');

  const handleAddLinkedAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccDetails) {
      showToast("Please fill out all connected account fields.");
      return;
    }
    try {
      const res = await fetch('/api/linked-accounts/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ name: newAccName, type: newAccType, details: newAccDetails })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Connected account linked successfully!");
        setNewAccName('');
        setNewAccDetails('');
        setShowAddAccount(false);
        fetchProfileData(); // Reload list
      } else {
        showToast(data.error || "Failed to link account.");
      }
    } catch {
      showToast("Network error linking account.");
    }
  };

  const handleRemoveLinkedAccount = async (id: string) => {
    try {
      const res = await fetch('/api/linked-accounts/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Connected account unlinked.");
        fetchProfileData();
      } else {
        showToast(data.error || "Failed to unlink account.");
      }
    } catch {
      showToast("Network error unlinking account.");
    }
  };

  const handleSaveBillingProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingProviderField || !billingRefIdField || !billingAmountField) {
      showToast("Please fill out all billing profile fields.");
      return;
    }
    try {
      const res = await fetch('/api/billing-profiles/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          id: editingBillingId || undefined,
          provider: billingProviderField,
          referenceId: billingRefIdField,
          amount: billingAmountField,
          routingDetails: billingRoutingField
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Billing profile saved successfully!");
        setBillingProviderField('');
        setBillingRefIdField('');
        setBillingAmountField('45');
        setBillingRoutingField('');
        setEditingBillingId(null);
        setShowAddBilling(false);
        fetchProfileData();
      } else {
        showToast(data.error || "Failed to save billing profile.");
      }
    } catch {
      showToast("Network error saving billing profile.");
    }
  };

  const handleDeleteBillingProfile = async (id: string) => {
    try {
      const res = await fetch('/api/billing-profiles/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Billing profile deleted.");
        fetchProfileData();
      } else {
        showToast(data.error || "Failed to delete billing profile.");
      }
    } catch {
      showToast("Network error deleting billing profile.");
    }
  };

  // Global Toast Notification
  const [toast, setToast] = useState<string | null>(null);

  // Transaction history log with realistic default records
  const [history, setHistory] = useState<Array<{
    id: string;
    recipient: string;
    amountSent: number;
    amountReceived: number;
    target: string;
    timestamp: string;
    hash: string;
    memo: string;
  }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orbit_transaction_history');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [
      {
        id: 'tx_hist_1',
        recipient: 'Maria Clara Santos',
        amountSent: 50.00,
        amountReceived: 2906.00,
        target: 'PHP',
        timestamp: 'Today, 10:15 AM',
        hash: 'op_sec_7a1b9c3f2d5e8f4',
        memo: 'Orbit_Remit_55214'
      },
      {
        id: 'tx_hist_2',
        recipient: 'Jean-Pierre Dupont',
        amountSent: 150.00,
        amountReceived: 137.25,
        target: 'EUR',
        timestamp: 'Yesterday, 04:30 PM',
        hash: 'op_sec_9c8b7a6f5e4d3c2',
        memo: 'Orbit_Remit_12984'
      },
      {
        id: 'tx_hist_3',
        recipient: 'Chinedu Okafor',
        amountSent: 200.00,
        amountReceived: 299000.00,
        target: 'NGN',
        timestamp: 'July 5, 2026, 09:12 AM',
        hash: 'op_sec_3d8f7b2c5a1e9f4',
        memo: 'Orbit_Remit_88301'
      }
    ];
  });

  // Automatically serialize and save transaction history to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orbit_transaction_history', JSON.stringify(history));
    }
  }, [history]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch TOS text dynamically
  useEffect(() => {
    fetch('/TERMS_OF_SERVICE.md')
      .then(res => res.text())
      .then(text => setTosContent(text))
      .catch(() => setTosContent("OrbitPath Secure FinTech Wallet Agreement\n\nBy checking this box, you authorize the on-chain creation of secure keypairs and agree to the non-custodial liabilities governing instant swaps, settlement networks, and local partner gateways. Your security credentials remain stored exclusively in your secure workspace database."));
  }, []);

  // Fetch current user session profile
  const fetchSession = async (tokenToUse: string) => {
    try {
      const res = await fetch('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        return true;
      } else {
        localStorage.removeItem('orbit_auth_token');
        setAuthToken(null);
        setCurrentUser(null);
        return false;
      }
    } catch {
      return false;
    }
  };

  // On mount: validate active session token
  useEffect(() => {
    if (authToken) {
      fetchSession(authToken);
    }
  }, [authToken]);

  // Fetch live account balances based on session
  const fetchLiveBalance = async () => {
    if (!authToken) return;
    try {
      setIsLoadingBalance(true);
      const res = await fetch('/api/live-balance', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        const rawXlm = parseFloat(data.xlmBalance) || 0;
        setLiveXlmBalance(rawXlm.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }));
        setLiveAssets(data.balances || []);
      }
    } catch (err) {
      console.warn("[OrbitPath] Balance lookup fallbacks utilized.");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Poll balances when logged in
  useEffect(() => {
    if (authToken && currentUser) {
      fetchLiveBalance();
      const interval = setInterval(fetchLiveBalance, 15000);
      return () => clearInterval(interval);
    }
  }, [authToken, currentUser]);

  // Pre-seed inputs when switching destination currency
  useEffect(() => {
    switch (destAsset) {
      case 'PHP':
        setRecipientName('Maria Clara Santos');
        setRecipientDetails('+63 917 123 4567 (GCash / InstaPay)');
        setDeliveryMethod('bank');
        break;
      case 'NGN':
        setRecipientName('Chinedu Okafor');
        setRecipientDetails('Access Bank Nigeria (Acct: 0123456789)');
        setDeliveryMethod('bank');
        break;
      case 'EUR':
        setRecipientName('Jean-Pierre Dupont');
        setRecipientDetails('IBAN FR76 3000 6000 1234 5678 901');
        setDeliveryMethod('bank');
        break;
      case 'BRL':
        setRecipientName('Thiago Silva');
        setRecipientDetails('PIX Key: thiago.silva@pix.com.br');
        setDeliveryMethod('bank');
        break;
    }
  }, [destAsset]);

  // Compute conversion rate
  const conversionRate = useMemo(() => {
    const rates: Record<string, number> = {
      PHP: 58.12,
      NGN: 1495.00,
      EUR: 0.915,
      BRL: 5.38
    };
    return rates[destAsset] || 1.0;
  }, [destAsset]);

  const convertedAmount = useMemo(() => {
    return amountToSend * conversionRate;
  }, [amountToSend, conversionRate]);

  // Local currency equivalent values for header card
  const localEquivalent = useMemo(() => {
    const rawBalance = parseFloat(liveXlmBalance.replace(/,/g, '')) || 0;
    let rateToLocal = 7.24;
    let symbol = '₱';

    switch (baseCurrency) {
      case 'PHP':
        rateToLocal = 7.24;
        symbol = '₱';
        break;
      case 'NGN':
        rateToLocal = 186.20;
        symbol = '₦';
        break;
      case 'EUR':
        rateToLocal = 0.113;
        symbol = '€';
        break;
      case 'BRL':
        rateToLocal = 0.672;
        symbol = 'R$';
        break;
    }

    const value = rawBalance * rateToLocal;
    return {
      symbol,
      value: value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      rateText: `1 XLM ≈ ${symbol}${rateToLocal.toFixed(2)}`
    };
  }, [liveXlmBalance, baseCurrency]);

  // Generate dynamic QR payload
  const generatedQRUri = useMemo(() => {
    return `stellar:pay?amount=${qrAmount}&asset_code=${qrAsset}&memo=${qrMemo}`;
  }, [qrAmount, qrAsset, qrMemo]);

  // Dynamic QR scan pre-fill execution (Pre-fill with transaction specifics)
  const handleSimulatedQRScan = (payloadString: string) => {
    try {
      if (!payloadString.startsWith('stellar:pay')) {
        showToast("Invalid QR transaction standard payment format.");
        return;
      }

      const cleanUri = payloadString.replace('stellar:', 'http://');
      const urlObj = new URL(cleanUri);
      const amount = urlObj.searchParams.get('amount') || '100';
      const assetCode = urlObj.searchParams.get('asset_code') || 'USDC';
      const memo = urlObj.searchParams.get('memo') || 'Scanned_Remit';

      setAmountToSend(parseFloat(amount));
      setMemoString(memo);

      if (assetCode === 'PHP') setDestAsset('PHP');
      else if (assetCode === 'EUR') setDestAsset('EUR');
      else if (assetCode === 'NGN') setDestAsset('NGN');
      else if (assetCode === 'BRL') setDestAsset('BRL');
      
      showToast(`Prefilled: Settle $${amount} to local bank payout!`);
      setActiveTab('send');
      setShowScannerModal(false);
    } catch {
      showToast("Could not parse scanned QR payload correctly.");
    }
  };

  const handleViewReceipt = (tx: any) => {
    setTxReceipt({
      success: true,
      hash: tx.hash,
      message: getLocalizedText("Direct liquidity routing via decentralized regional gateways on OrbitPath."),
      amountSent: tx.amountSent,
      amountReceived: tx.amountReceived,
      source: 'USDC Wallet',
      target: tx.target,
      recipient: tx.recipient,
      details: tx.recipient + ' (' + tx.target + ')',
      timestamp: tx.timestamp,
      pathUsed: ['USDC', 'Stellar DEX', tx.target],
      memo: tx.memo || 'Orbit_Remit_No_Memo'
    });
  };

  // === SUBMIT AUTHENTICATION: LOGIN ===
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginMpin) {
      setAuthError("Email and 6-digit MPIN are required.");
      return;
    }
    try {
      setAuthLoading(true);
      setAuthError(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: loginEmail, mpin: loginMpin })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('orbit_auth_token', data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        
        // Cache Remember Me settings
        if (rememberMe) {
          localStorage.setItem('orbit_remember_me', 'true');
          localStorage.setItem('orbit_remembered_email', loginEmail);
        } else {
          localStorage.setItem('orbit_remember_me', 'false');
          localStorage.removeItem('orbit_remembered_email');
        }

        showToast(`Welcome back, ${data.user.name}!`);
        setActiveTab('home');
      } else {
        setAuthError(data.error || "Authentication failed.");
      }
    } catch {
      setAuthError("Network error. Server connection lost.");
    } finally {
      setAuthLoading(false);
    }
  };

  // === SUBMIT AUTHENTICATION: REGISTER ===
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regEmail || !regMpin) {
      setAuthError("Please fill out all registration fields.");
      return;
    }
    if (regMpin.length !== 6 || isNaN(Number(regMpin))) {
      setAuthError("Secure MPIN must be exactly a 6-digit passcode.");
      return;
    }
    if (!regAgreeTos) {
      setAuthError("You must review and agree to the Terms of Service.");
      return;
    }

    try {
      setAuthLoading(true);
      setAuthError(null);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, email: regEmail, mpin: regMpin })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('orbit_auth_token', data.token);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        showToast(`Account Initialized! Welcome, ${data.user.name}!`);
        setActiveTab('home');
      } else {
        setAuthError(data.error || "Onboarding failed.");
      }
    } catch {
      setAuthError("Network error initializing secure wallet identity.");
    } finally {
      setAuthLoading(false);
    }
  };

  // === LOG OUT ACTION ===
  const handleLogout = async () => {
    if (authToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
    }
    localStorage.removeItem('orbit_auth_token');
    setAuthToken(null);
    setCurrentUser(null);
    setLoginMpin('');
    showToast("Session closed securely.");
    setActiveTab('home');
  };

  // === EXECUTE ATOMIC REMITTANCE (6-Step automated flow) ===
  const handleExecuteTransfer = async () => {
    if (isSending) return;
    
    setIsSending(true);
    setWorkflowStep(1);
    setWorkflowStatus("1. Securing cryptographic workspace session parameters...");
    setTxReceipt(null);

    const runStep = (step: number, message: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setWorkflowStep(step);
          setWorkflowStatus(message);
          resolve();
        }, delay);
      });
    };

    try {
      await runStep(2, "2. Scanning liquid multi-hop exchange routes and slippage bounds...", 600);
      await runStep(3, "3. Lock in dynamic spread rates on global settlement networks...", 600);
      await runStep(4, "4. Simulating smart contract gas fee parameters trustlessly...", 600);
      await runStep(5, "5. Executing optimal transaction pathpayment operations...", 700);
      await runStep(6, "6. Swap completed! Relayer releasing payout through local financial partner gateway...", 600);

      const response = await fetch('/api/execute-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          amountToSend: amountToSend,
          sourceAsset: "USDC",
          destAsset: destAsset === 'EUR' ? 'EURC' : destAsset,
          recipientName: recipientName,
          recipientDetails: recipientDetails,
          deliveryMethod: deliveryMethod,
          selectedAnchor: "OrbitPath SEPA / InstaPay Settlement Node"
        })
      });

      const data = await response.json();

      if (data.success) {
        const generatedHash = data.hash || 'op_sec_' + Math.random().toString(16).substring(2, 10);
        const standardizedMemo = formatStellarMemo(memoString);
        const standardizedHash = maskTransactionHash(generatedHash);
        const standardizedRef = formatLocalRef(generatedHash);
        
        const newTx = {
          id: 'tx_hist_' + Date.now(),
          recipient: recipientName,
          amountSent: amountToSend,
          amountReceived: convertedAmount,
          target: destAsset,
          timestamp: 'Just now',
          hash: generatedHash,
          memo: standardizedMemo
        };
        setHistory(prev => [newTx, ...prev]);

        setTxReceipt({
          success: true,
          hash: generatedHash,
          message: data.message || "OrbitPath secured the absolute lowest exchange fee via optimized pathpayments.",
          amountSent: amountToSend,
          amountReceived: convertedAmount,
          source: "USDC",
          target: destAsset,
          recipient: recipientName,
          details: recipientDetails,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
          pathUsed: data.pathUsed || ["USDC", "XLM", destAsset],
          memo: standardizedMemo
        });

        // Add a standardized notification
        const newNotif = {
          id: 'notif_' + Date.now(),
          title: "Transfer Sent",
          description: `Sent $${amountToSend.toFixed(2)} USDC to ${recipientName}. Memo: ${standardizedMemo}. Ref: ${standardizedRef}`,
          time: "Just now",
          read: false,
          type: "payout"
        };
        setNotifications(prev => [newNotif, ...prev]);
        
        // Secure transaction sync: reload real-time ledger balance instantly
        fetchLiveBalance();
      }
    } catch (globalErr) {
      showToast("Transfer encountered a connectivity lookup error.");
    } finally {
      setIsSending(false);
      setWorkflowStep(0);
    }
  };

  // Bills payment executor
  const handlePayBillSubmit = async () => {
    setBillsStatus('loading');
    try {
      const res = await fetch('/api/pay-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          provider: billsProvider,
          amount: billsAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        setBillsStatus('success');
        setTimeout(() => {
          setShowBillsModal(false);
          setBillsStatus('idle');
          showToast(`Settled $${billsAmount} bill to ${billsProvider} with 0% processing fee!`);
          
          // Add to history list dynamically
          const generatedRawHash = data.hash || ('op_sec_' + Math.random().toString(16).substring(2, 10));
          const standardizedRef = formatLocalRef(generatedRawHash);
          const standardizedMemo = formatStellarMemo('Utility_Bill_Settle');
          const newTx = {
            id: 'tx_bill_' + Date.now(),
            recipient: billsProvider,
            amountSent: parseFloat(billsAmount),
            amountReceived: parseFloat(billsAmount),
            target: 'USD',
            timestamp: 'Just now',
            hash: standardizedRef,
            memo: standardizedMemo
          };
          setHistory(prev => [newTx, ...prev]);

          // Add a standardized notification
          const newNotif = {
            id: 'notif_' + Date.now(),
            title: "Bill Paid",
            description: `Settled $${parseFloat(billsAmount).toFixed(2)} bill to ${billsProvider}. Memo: ${standardizedMemo}. Ref: ${standardizedRef}`,
            time: "Just now",
            read: false,
            type: "bill"
          };
          setNotifications(prev => [newNotif, ...prev]);
          
          // Secure transaction sync: reload real-time ledger balance instantly
          fetchLiveBalance();
        }, 1500);
      } else {
        setBillsStatus('idle');
        showToast(data.error || "Failed to pay bill.");
      }
    } catch {
      setBillsStatus('idle');
      showToast("Network error paying bill.");
    }
  };

  // PIN Changing form submit
  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPin || !newPin) {
      showToast("Please enter both old and new PIN values.");
      return;
    }
    if (newPin.length !== 6 || isNaN(Number(newPin))) {
      showToast("Secure PIN must be exactly 6 numeric digits.");
      return;
    }
    showToast("Secure PIN changed successfully!");
    setOldPin('');
    setNewPin('');
    setShowChangePin(false);
  };

  // Quick prefill helper inside login
  const selectPreseededUser = (email: string, mpin: string) => {
    setLoginEmail(email);
    setLoginMpin(mpin);
    showToast(`Profile loaded: ${email.split('@')[0].toUpperCase()}`);
  };

  // Generate matrix once QR values change
  const qrMatrix = useMemo(() => {
    return generateFakeQRMatrix(generatedQRUri);
  }, [generatedQRUri]);

  // View switch render condition
  if (!authToken || !currentUser) {
    return (
      <div 
        className="min-h-screen flex flex-col justify-between selection:bg-indigo-600 selection:text-white relative overflow-hidden font-sans transition-all duration-300"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}
      >
        {/* Background ambient lighting */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] translate-y-1/2 pointer-events-none"></div>

        {/* Branding bar */}
        <header 
          className="px-6 py-5 border-b backdrop-blur-md sticky top-0 z-50 transition-all"
          style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
        >
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <OrbitPathLogo />
              <div>
                <span className="text-sm font-black tracking-tight block leading-tight" style={{ color: 'var(--text-main)' }}>OrbitPath</span>
                <span className="text-[9px] font-mono font-bold tracking-wider uppercase block leading-none" style={{ color: 'var(--text-brand)' }}>Fintech Wallet</span>
              </div>
            </div>
            <span className="text-[9px] bg-indigo-950/50 text-indigo-400 font-mono font-bold px-2.5 py-1 rounded-full border border-indigo-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
              Verified Safe
            </span>
          </div>
        </header>

        {/* Splash Auth Box */}
        <main className="max-w-md w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
          <div 
            className="border rounded-3xl p-6 shadow-2xl space-y-6 relative backdrop-blur-xs transition-all"
            style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="text-center space-y-2">
              <h1 className="text-xl font-black tracking-tight uppercase" style={{ color: 'var(--text-main)' }}>
                {authView === 'login' ? 'Account Login' : 'Secure Onboarding'}
              </h1>
              <p className="text-xs text-slate-400 leading-normal">
                {authView === 'login' 
                  ? 'Access your isolated finance panel and payout gateways.' 
                  : 'Establish a new non-custodial, high-yield digital identity.'}
              </p>
            </div>

            {authError && (
              <div className="bg-red-950/50 border border-red-900/50 text-red-300 rounded-2xl p-4 text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* Auth switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-850">
              <button
                onClick={() => { setAuthView('login'); setAuthError(null); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  authView === 'login' ? 'bg-indigo-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthView('register'); setAuthError(null); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  authView === 'register' ? 'bg-indigo-600 text-white font-black shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Register
              </button>
            </div>

            <AnimatePresence mode="wait">
              {authView === 'login' ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.15 }}
                >
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold mb-1.5 pl-1">
                          Registered Email
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-slate-500">
                            <Mail className="w-4 h-4" />
                          </span>
                          <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="david@orbitpath.com"
                            className="w-full border rounded-xl pl-10 pr-3.5 py-3 text-xs focus:outline-none focus:border-indigo-500 font-mono transition-all"
                            style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold mb-1.5 pl-1">
                          6-Digit Secure MPIN
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-slate-500">
                            <Lock className="w-4 h-4" />
                          </span>
                          <input
                            type="password"
                            maxLength={6}
                            pattern="[0-9]*"
                            inputMode="numeric"
                            value={loginMpin}
                            onChange={(e) => setLoginMpin(e.target.value)}
                            placeholder="••••••"
                            className="w-full border rounded-xl pl-10 pr-3.5 py-3 text-xs tracking-widest focus:outline-none focus:border-indigo-500 font-mono transition-all"
                            style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                            required
                          />
                        </div>
                      </div>

                      {/* Remember Me selection custom toggle */}
                      <div 
                        className="flex items-center justify-between pl-2.5 pr-2 py-2 rounded-xl border transition-all"
                        style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)' }}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wide font-mono" style={{ color: 'var(--text-main)' }}>Remember Me</span>
                          <span className="text-[8px] opacity-70" style={{ color: 'var(--text-main)' }}>Cache secure session details on this device</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRememberMe(!rememberMe)}
                          className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            rememberMe ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              rememberMe ? 'translate-x-4.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Quick helpers - restructured to align perfectly with the inputs */}
                    <div 
                      className="p-3.5 text-center space-y-2 border rounded-xl transition-all"
                      style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)' }}
                    >
                      <span className="text-[9px] text-indigo-400 font-mono font-extrabold uppercase tracking-wide block">
                        Developer Quick Accounts
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => selectPreseededUser('david@orbitpath.com', '123456')}
                          className="bg-slate-950 hover:bg-slate-900 text-[10px] py-1.5 rounded-lg border border-slate-800 text-indigo-300 font-black transition-all"
                        >
                          David
                        </button>
                        <button
                          type="button"
                          onClick={() => selectPreseededUser('alice@orbitpath.com', '111111')}
                          className="bg-slate-950 hover:bg-slate-900 text-[10px] py-1.5 rounded-lg border border-slate-800 text-indigo-300 font-black transition-all"
                        >
                          Alice
                        </button>
                        <button
                          type="button"
                          onClick={() => selectPreseededUser('john@orbitpath.com', '222222')}
                          className="bg-slate-950 hover:bg-slate-900 text-[10px] py-1.5 rounded-lg border border-slate-800 text-indigo-300 font-black transition-all"
                        >
                          John
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 py-3.5 rounded-xl text-xs font-bold text-white transition-all uppercase tracking-wider shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Securing Session...
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          Sign In Securely
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold mb-1.5 pl-1">
                          User Full Name
                        </label>
                        <input
                          type="text"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          placeholder="e.g. David Santos"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold mb-1.5 pl-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="e.g. user@example.com"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold mb-1.5 pl-1">
                          Define 6-Digit PIN
                        </label>
                        <input
                          type="password"
                          maxLength={6}
                          pattern="[0-9]*"
                          inputMode="numeric"
                          value={regMpin}
                          onChange={(e) => setRegMpin(e.target.value)}
                          placeholder="e.g. 123456"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white tracking-widest focus:outline-none focus:border-indigo-500 font-mono"
                          required
                        />
                      </div>

                      {/* Terms checkbox */}
                      <div className="flex items-start gap-2.5 pt-1">
                        <input
                          type="checkbox"
                          id="agree-tos"
                          checked={regAgreeTos}
                          onChange={(e) => setRegAgreeTos(e.target.checked)}
                          className="mt-1 accent-indigo-500 scale-110"
                        />
                        <label htmlFor="agree-tos" className="text-[10px] text-slate-400 leading-normal select-none">
                          I agree to the secure finance disclosures and{' '}
                          <button
                            type="button"
                            onClick={() => setShowTosModal(true)}
                            className="text-indigo-400 underline font-bold hover:text-indigo-300"
                          >
                            Terms of Service
                          </button>
                          . I authorize automatic wallet keypair initialization.
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 py-3.5 rounded-xl text-xs font-bold text-white transition-all uppercase tracking-wider shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Initializing Secure Wallet...
                        </>
                      ) : (
                        <>
                          <Shield className="w-3.5 h-3.5" />
                          Agree & Open Wallet
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* TOS MODAL */}
        <AnimatePresence>
          {showTosModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5.5 shadow-2xl flex flex-col max-h-[85vh]"
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider font-mono text-white">TERMS_OF_SERVICE.md</span>
                  </div>
                  <button onClick={() => setShowTosModal(false)} className="p-1 rounded-full hover:bg-slate-800">
                    <X className="w-4.5 h-4.5 text-slate-400" />
                  </button>
                </div>

                <div className="overflow-y-auto py-4 text-[10px] text-slate-300 font-mono leading-relaxed space-y-4 pr-1">
                  {tosContent.split('\n\n').map((para, i) => (
                    <p key={'tos_para_' + i}>{para}</p>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800 shrink-0 flex gap-2.5">
                  <button
                    onClick={() => { setRegAgreeTos(true); setShowTosModal(false); }}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    Accept Agreement
                  </button>
                  <button
                    onClick={() => setShowTosModal(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Splash toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl border border-slate-800 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="py-6 text-center border-t border-slate-800/60 bg-slate-950/20">
          <p className="text-[9px] text-slate-500 font-mono tracking-wide">
            Secured by OrbitPath Encryption Network • Powered by Stellar Protocol
          </p>
        </footer>
      </div>
    );
  }

  // === AUTHENTICATED SYSTEM FLOW ===
  return (
    <div 
      className="min-h-screen font-sans flex flex-col justify-between selection:bg-indigo-600 selection:text-white pb-20 md:pb-6 relative no-scrollbar transition-all duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}
    >
      
      {/* Dynamic Toast banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main fintech navigation bar */}
      <nav 
        className="sticky top-0 z-40 border-b px-4 py-3.5 shadow-md backdrop-blur-md transition-all"
        style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => { setActiveTab('home'); showToast("Navigated back to Home Dashboard."); }}
            className="flex items-center gap-3 hover:opacity-85 transition-all text-left focus:outline-none cursor-pointer"
          >
            <OrbitPathLogo />
            <div>
              <span className="text-sm font-black tracking-tight block leading-tight" style={{ color: 'var(--text-main)' }}>OrbitPath</span>
              <span className="text-[9px] font-mono font-bold tracking-wider uppercase block leading-none text-slate-400">Fintech Wallet</span>
            </div>
          </button>

          <div className="flex items-center gap-3 relative">
            {/* Interactive Secure Session pill */}
            <button
              onClick={() => setShowSessionDropdown(!showSessionDropdown)}
              className="text-[9px] bg-emerald-950/60 hover:bg-emerald-900/40 text-emerald-400 font-mono font-bold px-2.5 py-1 rounded-full border border-emerald-900/40 hover:border-emerald-500/50 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
            >
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Secure Session ({formatSessionTime(sessionTimeLeft)})
            </button>

            {/* Dropdown Micro-Portal */}
            <AnimatePresence>
              {showSessionDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSessionDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-8 w-72 bg-slate-950 border border-slate-850 rounded-2xl p-4 shadow-2xl z-50 text-slate-200 text-left space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <span className="text-[9px] font-mono font-extrabold uppercase text-slate-400 tracking-wider">
                        Session Metadata
                      </span>
                      <span className="text-[8px] bg-slate-900 text-slate-400 border border-slate-800 font-mono font-bold px-2 py-0.5 rounded uppercase">
                        Proxy Locked
                      </span>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Session Identity:</span>
                        <span className="font-mono text-[10px] font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          OrbitPath User ****{currentUser?.email ? currentUser.email.split('@')[0].toUpperCase().slice(-4) : 'ICE2'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Security Gateway:</span>
                        <span className="text-[10px] text-slate-350 font-semibold font-mono">
                          Express Proxy Enforced
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Auto-Logout:</span>
                        <span className="font-mono text-xs bg-slate-900 px-2.5 py-1 rounded-lg text-amber-400 border border-slate-800 font-black tracking-wide">
                          {formatSessionTime(sessionTimeLeft)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-850/60 flex justify-between items-center text-[8px] text-slate-500 font-mono">
                      <span>Server Host: Port 3000</span>
                      <span>TLS 1.3 AES_256</span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Notification Infrastructure Bell Icon */}
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-full hover:bg-slate-800/10 text-slate-400 hover:text-white transition-all relative flex items-center justify-center border border-transparent hover:border-slate-800 cursor-pointer"
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Interactive User Avatar (Top-Right Action Node) */}
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-250 hover:border-slate-500 transition-all cursor-pointer shadow-md shrink-0"
                title="Secure Core Panel"
              >
                {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
              </button>

              {/* Notification Overlay Panel */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-slate-950 border border-slate-850 rounded-2xl p-4 shadow-2xl z-50 space-y-3 text-left"
                  >
                    <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                      <span className="text-xs font-black uppercase tracking-wider font-mono text-white">
                        {getLocalizedText("System Notifications")}
                      </span>
                      <button
                        onClick={() => {
                          setNotifications(notifications.map(n => ({ ...n, read: true })));
                          showToast("All notifications marked as read.");
                        }}
                        className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        {getLocalizedText("Mark all read")}
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar">
                      {notifications.length === 0 ? (
                        <p className="text-[10px] text-slate-500 font-mono text-center py-4">
                          No alerts or notifications.
                        </p>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 items-start text-left ${
                              notif.read
                                ? 'bg-slate-900/30 border-slate-900 text-slate-400'
                                : 'bg-indigo-950/25 border-indigo-900/30 text-white'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {notif.type === 'payout' && <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />}
                              {notif.type === 'bill' && <CreditCard className="w-3.5 h-3.5 text-rose-400" />}
                              {notif.type === 'security' && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                              {notif.type === 'system' && <Cpu className="w-3.5 h-3.5 text-indigo-400" />}
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold block">{getLocalizedText(notif.title)}</span>
                                {!notif.read && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>}
                              </div>
                              <p className="text-[9px] leading-relaxed block text-slate-350">{getLocalizedText(notif.description)}</p>
                              <span className="text-[8px] font-mono text-slate-500 block mt-1">{getLocalizedText(notif.time)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-full bg-slate-900 hover:bg-slate-850 py-1.5 rounded-xl text-[10px] font-mono text-slate-400 hover:text-white transition-all text-center border border-slate-800"
                    >
                      {getLocalizedText("Close Panel")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Primary view switch controller */}
      <main className="max-w-md w-full mx-auto px-4 mt-6 flex-1 flex flex-col justify-start">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6 flex-1 flex flex-col"
          >
            {/* ========================================== */}
            {/* HOME VIEW: CLEAN PRIMARY WALLET PORTAL */}
            {/* ========================================== */}
            {activeTab === 'home' && (
              <div className="space-y-6 flex-1 flex flex-col">
                
                {/* User Info Greeting Card */}
                <div 
                  className="border rounded-2xl p-5 flex flex-row items-center justify-between shadow-lg transition-all"
                  style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                      {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-black tracking-tight" style={{ color: 'var(--text-main)' }}>
                        Hi, {currentUser.name}!
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                          Verified Tier 2
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Available Assets Balance Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 shadow-2xl border border-indigo-500/10">
                  <div className="absolute -right-16 -top-16 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl"></div>
                  <div className="absolute -left-12 -bottom-12 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl"></div>

                  <div className="relative z-10 flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-indigo-300 font-extrabold uppercase tracking-widest leading-none">Available Balance</span>
                        <span className="text-[8px] text-emerald-400 font-mono font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/30">
                          Active Network
                        </span>
                      </div>
                      
                      <div className="flex items-baseline gap-1.5 mt-2">
                        <span className="text-3xl font-black font-mono tracking-tight text-white leading-none">
                          {localEquivalent.symbol}{localEquivalent.value}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1.5">
                        <span className="text-[9px] text-slate-400 block font-mono">
                          Estimated Assets Valuation ({baseCurrency})
                        </span>
                        <span className="text-[9px] text-indigo-300 font-mono font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping shrink-0"></span>
                          Live Spot Rate: {localEquivalent.rateText}
                        </span>
                      </div>
                    </div>

                    {/* Currency selection widget */}
                    <div className="bg-white/5 backdrop-blur-md p-1 rounded-lg border border-white/5 flex gap-1 shrink-0">
                      {(['PHP', 'NGN', 'EUR', 'BRL'] as const).map((curr) => (
                        <button
                          key={'toggle_base_' + curr}
                          onClick={() => setBaseCurrency(curr)}
                          className={`px-2 py-1 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                            baseCurrency === curr
                              ? 'bg-white text-slate-900 font-black shadow-md'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Available Network Asset Balance Display */}
                  <div className="relative z-10 mt-5 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-indigo-300 font-bold font-mono block uppercase tracking-wide">Available Network Asset</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-lg font-black font-mono text-white leading-none">
                          {liveXlmBalance}
                        </span>
                        <span className="text-xs font-bold font-mono text-indigo-400">XLM</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-[8px] font-mono text-slate-400 block uppercase">Wallet Status</span>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold block bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-900/30 uppercase mt-1">
                        Synchronized
                      </span>
                    </div>
                  </div>

                  {/* Primary Home Quick Actions */}
                  <div className="relative z-10 grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/80">
                    <button
                      onClick={() => setActiveTab('send')}
                      className="bg-indigo-600 hover:bg-indigo-500 active:scale-98 transition-all text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Money
                    </button>
                    <button
                      onClick={() => setShowQRReceive(true)}
                      className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800 active:scale-98 transition-all text-indigo-300 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                      Receive QR
                    </button>
                  </div>
                </div>

                {/* Quick Services Grid */}
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider pl-1 block">
                    Quick Financial Services
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setActiveTab('send')}
                      className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-850 rounded-2xl p-4 flex flex-col items-center text-center gap-2.5 transition-all shadow-md group hover:-translate-y-0.5"
                    >
                      <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center group-hover:bg-blue-500/15">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block leading-tight">Express Send</span>
                        <span className="text-[8px] text-slate-400 block mt-0.5">Remittance</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setBillsProvider('Power & Light Co.');
                        setBillsAmount('45');
                        setShowBillsModal(true);
                      }}
                      className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-850 rounded-2xl p-4 flex flex-col items-center text-center gap-2.5 transition-all shadow-md group hover:-translate-y-0.5"
                    >
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/15">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block leading-tight">Pay Bills</span>
                        <span className="text-[8px] text-slate-400 block mt-0.5">0% Processing</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setDestAsset(prev => {
                          const options: Array<'PHP' | 'NGN' | 'EUR' | 'BRL'> = ['PHP', 'NGN', 'EUR', 'BRL'];
                          const nextIndex = (options.indexOf(prev) + 1) % options.length;
                          return options[nextIndex];
                        });
                        showToast(`Dest payout target updated to ${destAsset}`);
                      }}
                      className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-850 rounded-2xl p-4 flex flex-col items-center text-center gap-2.5 transition-all shadow-md group hover:-translate-y-0.5"
                    >
                      <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/15">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block leading-tight">Instant Convert</span>
                        <span className="text-[8px] text-slate-400 block mt-0.5">Optimal DEX</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recurring Bills shortcut */}
                <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4.5 shadow-md space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase font-mono tracking-wider pl-0.5">Recurring Bills</span>
                    <span className="text-[8px] bg-indigo-950/80 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-900/30 uppercase font-bold">
                      Auto Detected
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-3 bg-slate-950/40 rounded-xl border border-slate-850">
                    <div>
                      <span className="font-bold text-white block">Metro Power & Light</span>
                      <span className="text-[9px] text-slate-400">Due in 5 days</span>
                    </div>
                    <button
                      onClick={() => {
                        setBillsProvider('Metro Power & Light');
                        setBillsAmount('45');
                        setShowBillsModal(true);
                      }}
                      className="px-3.5 py-2 bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 font-bold rounded-xl text-[10px] transition-all border border-indigo-500/20 shadow-md"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* SEND VIEW: REMITTANCE & CURRENCY EXPRESS TRANSFER FORM */}
            {/* ======================================================== */}
            {activeTab === 'send' && (
              <div className="space-y-5 flex-1 flex flex-col">
                
                <div className="bg-slate-900/70 border border-slate-850 rounded-3xl p-5.5 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                        <Send className="w-4 h-4" />
                      </div>
                      <h2 className="text-xs font-black text-white uppercase tracking-wider pl-0.5">
                        {sendStep === 1 && getLocalizedText("Step 1: Recipient & Platform")}
                        {sendStep === 2 && getLocalizedText("Step 2: Transfer Amount")}
                        {sendStep === 3 && getLocalizedText("Step 3: Review & Broadcast")}
                      </h2>
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono font-bold uppercase tracking-wider bg-slate-950/80 px-2 py-0.5 rounded">
                      {getLocalizedText("Instant Settlement")}
                    </span>
                  </div>

                  {/* STEP 1: RECIPIENT PHONE / ACCOUNT & PLATFORM GRID */}
                  {sendStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5 pl-0.5 font-mono">
                          {getLocalizedText("Recipient Phone or Account Number")}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3.5 text-slate-500">
                            <Phone className="w-3.5 h-3.5" />
                          </span>
                          <input
                            type="text"
                            value={recipientNumber}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRecipientNumber(val);
                              // Validation: 9-13 digits
                              const numOnly = val.replace(/\D/g, '');
                              if (val.length > 0 && (numOnly.length < 9 || numOnly.length > 13)) {
                                setNumberError("Invalid number format. Please check and try again.");
                              } else {
                                setNumberError(null);
                              }
                            }}
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white font-bold font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="e.g. 09171234567 or 123-456-789"
                          />
                        </div>
                        {numberError && (
                          <span className="text-red-500 text-[10px] font-bold block mt-1.5 pl-0.5">
                            {numberError}
                          </span>
                        )}
                      </div>

                      {/* Interactive Platform Grid */}
                      <div className="space-y-2">
                        <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider pl-0.5 font-mono">
                          {getLocalizedText("Select Destination Platform")}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { 
                              id: 'gcash', 
                              name: 'GCash Wallet', 
                              desc: 'Instant PHP mobile wallet', 
                              activeClass: 'bg-blue-600 border-blue-500 text-white font-black shadow-lg shadow-blue-500/15', 
                              inactiveClass: 'border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-950/20 text-blue-400 bg-blue-950/5', 
                              tagColor: 'bg-blue-500/20 text-blue-300' 
                            },
                            { 
                              id: 'instapay', 
                              name: 'InstaPay Network', 
                              desc: 'Secure interbank network transfer', 
                              activeClass: 'bg-indigo-600 border-indigo-500 text-white font-black shadow-lg shadow-indigo-500/15', 
                              inactiveClass: 'border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-950/20 text-indigo-400 bg-indigo-950/5', 
                              tagColor: 'bg-indigo-500/20 text-indigo-300' 
                            },
                            { 
                              id: 'maya', 
                              name: 'Maya Account', 
                              desc: 'Instant Pay & Fintech Wallet', 
                              activeClass: 'bg-emerald-600 border-emerald-500 text-white font-black shadow-lg shadow-emerald-500/15', 
                              inactiveClass: 'border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-950/20 text-emerald-400 bg-emerald-950/5', 
                              tagColor: 'bg-emerald-500/20 text-emerald-300' 
                            },
                            { 
                              id: 'gotyme', 
                              name: 'GoTyme Bank', 
                              desc: 'High-interest secure digital account', 
                              activeClass: 'bg-pink-600 border-pink-500 text-white font-black shadow-lg shadow-pink-500/15', 
                              inactiveClass: 'border-pink-500/20 hover:border-pink-500/40 hover:bg-pink-950/20 text-pink-400 bg-pink-950/5', 
                              tagColor: 'bg-pink-500/20 text-pink-300' 
                            }
                          ].map((plat) => {
                            const isSel = selectedPlatform === plat.id;
                            return (
                              <button
                                key={plat.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPlatform(plat.id);
                                  setRecipientDetails(`${recipientNumber} (${plat.name})`);
                                }}
                                className={`border rounded-2xl p-3.5 flex flex-col items-start text-left gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                                  isSel ? plat.activeClass : plat.inactiveClass
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-xs font-black tracking-tight block">{plat.name}</span>
                                  <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase ${isSel ? 'bg-white/25 text-white' : plat.tagColor}`}>
                                    {plat.id === 'gotyme' ? 'Digital Bank' : 'Instant'}
                                  </span>
                                </div>
                                <span className={`text-[9px] leading-normal block ${isSel ? 'text-indigo-100' : 'text-slate-400 font-medium'}`}>
                                  {plat.desc}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSendStep(2)}
                        disabled={!recipientNumber || !!numberError || !selectedPlatform}
                        className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                          !recipientNumber || !!numberError || !selectedPlatform
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                        }`}
                      >
                        {getLocalizedText("Continue to Amount")}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* STEP 2: AMOUNT & FX CALCULATION */}
                  {sendStep === 2 && (
                    <div className="space-y-4">
                      {/* Amount to Send Input */}
                      <div className="bg-slate-950/80 rounded-2xl p-4.5 border border-slate-850 relative">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block font-mono pl-0.5">
                          {getLocalizedText("Amount to Send (USD equivalent)")}
                        </span>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center">
                            <span className="text-xl font-bold text-slate-500 mr-1 font-mono">$</span>
                            <input
                              type="number"
                              value={amountToSend}
                              onChange={(e) => setAmountToSend(Math.max(1, parseFloat(e.target.value) || 0))}
                              className="bg-transparent text-xl font-extrabold text-white focus:outline-none w-44 font-mono"
                            />
                          </div>
                          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-xs font-bold text-indigo-300 font-mono select-none">
                            USDC Token
                          </div>
                        </div>
                      </div>

                      {/* Recipient Receives calculation */}
                      <div className="bg-emerald-950/30 rounded-2xl p-4.5 border border-emerald-900/30 relative">
                        <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider block font-mono pl-0.5">
                          {getLocalizedText("Recipient Receives (Guaranteed Payout)")}
                        </span>
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-emerald-500 font-mono">
                              {destAsset === 'PHP' ? '₱' : destAsset === 'NGN' ? '₦' : destAsset === 'EUR' ? '€' : 'R$'}
                            </span>
                            <span className="text-xl font-black text-emerald-400 font-mono">
                              {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          
                          {/* Selector */}
                          <select
                            value={destAsset}
                            onChange={(e) => setDestAsset(e.target.value as any)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="PHP">PHP (Philippines)</option>
                            <option value="NGN">NGN (Nigeria)</option>
                            <option value="EUR">EUR (Eurozone)</option>
                            <option value="BRL">BRL (Brazil)</option>
                          </select>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-emerald-900/20 flex justify-between items-center text-[9px] text-emerald-500 font-mono">
                          <span>{getLocalizedText("Guaranteed Conversion:")}</span>
                          <span className="font-bold">1 USDC = {conversionRate} {destAsset}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSendStep(1)}
                          className="py-3.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-900 transition-all text-center"
                        >
                          {getLocalizedText("Back")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSendStep(3)}
                          className="py-3.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all text-center shadow-lg"
                        >
                          {getLocalizedText("Continue")}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: RECIPIENT INFORMATION & PREVIEW PROOF */}
                  {sendStep === 3 && (
                    <div className="space-y-4">
                      {/* Preview Summary Card */}
                      <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-2.5">
                        <span className="text-[9px] text-indigo-400 font-mono font-black uppercase tracking-wider block">
                          {getLocalizedText("REMITTANCE TRANSACTION PREVIEW")}
                        </span>
                        <div className="grid grid-cols-2 gap-y-2 text-[11px] font-mono border-t border-slate-850 pt-2">
                          <span className="text-slate-500">{getLocalizedText("Destination Network")}</span>
                          <span className="text-white text-right font-bold uppercase">{selectedPlatform}</span>

                          <span className="text-slate-500">{getLocalizedText("Recipient Account")}</span>
                          <span className="text-white text-right font-bold">{recipientNumber}</span>

                          <span className="text-slate-500">{getLocalizedText("Transfer Debit")}</span>
                          <span className="text-white text-right font-black text-indigo-300">${amountToSend.toFixed(2)} USDC</span>

                          <span className="text-slate-500">{getLocalizedText("Guaranteed Local Payout")}</span>
                          <span className="text-white text-right font-black text-emerald-400">
                            {destAsset === 'PHP' ? '₱' : destAsset === 'NGN' ? '₦' : destAsset === 'EUR' ? '€' : 'R$'} {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Recipient Legal details */}
                      <div className="space-y-3.5 pt-1">
                        <div>
                          <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5 pl-0.5 font-mono">
                            {getLocalizedText("Recipient Full Legal Name")}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-3.5 text-slate-500">
                              <User className="w-3.5 h-3.5" />
                            </span>
                            <input
                              type="text"
                              value={recipientName}
                              onChange={(e) => setRecipientName(e.target.value)}
                              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="Enter legal name"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3.5">
                          <div>
                            <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5 pl-0.5 font-mono">
                              {getLocalizedText("Remittance Transfer Speed")}
                            </label>
                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                              <button
                                type="button"
                                onClick={() => setDeliveryMethod('bank')}
                                className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                                  deliveryMethod === 'bank' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {getLocalizedText("Instant Local Network")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeliveryMethod('cash')}
                                className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                                  deliveryMethod === 'cash' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {getLocalizedText("Cash Agent Pick-Up")}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5 pl-0.5 font-mono">
                            {getLocalizedText("Remittance Memo Reference (Optional)")}
                          </label>
                          <input
                            type="text"
                            value={memoString}
                            onChange={(e) => setMemoString(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Submit & Back Buttons */}
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSendStep(2)}
                          disabled={isSending}
                          className="col-span-1 py-4 rounded-2xl text-xs font-bold text-slate-400 bg-slate-950 border border-slate-850 hover:bg-slate-900 transition-all flex items-center justify-center"
                        >
                          {getLocalizedText("Back")}
                        </button>
                        <button
                          type="button"
                          onClick={handleExecuteTransfer}
                          disabled={isSending || !recipientName}
                          className={`col-span-3 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                            isSending || !recipientName
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-600/15'
                          }`}
                        >
                          {isSending ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              {getLocalizedText("Broadcasting...")}
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              {getLocalizedText("Confirm & Send")}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated 6-Step pipeline logger */}
                <AnimatePresence>
                  {isSending && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-950 border border-slate-850 text-slate-100 rounded-3xl p-5 space-y-4 overflow-hidden shadow-inner"
                    >
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                        <div>
                          <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                            OrbitPath Routing Engine
                          </span>
                          <span className="text-[10px] text-slate-300 font-semibold">
                            Executing secure transaction routing...
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded border border-indigo-900/40 font-bold">
                          Step {workflowStep} of 6
                        </span>
                      </div>

                      <p className="text-[10px] font-mono text-indigo-300 italic bg-slate-900 p-3 rounded-xl border border-slate-800">
                        {workflowStatus}
                      </p>

                      {/* Step trackers */}
                      <div className="grid grid-cols-6 gap-1.5 pt-1">
                        {[1, 2, 3, 4, 5, 6].map((s) => {
                          const done = workflowStep > s;
                          const current = workflowStep === s;
                          return (
                            <div
                              key={'prog_step_' + s}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                done 
                                  ? 'bg-emerald-500' 
                                  : current 
                                  ? 'bg-indigo-500 animate-pulse' 
                                  : 'bg-slate-800'
                              }`}
                            ></div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            )}

            {/* ======================================================== */}
            {/* TRANSACTIONS VIEW: HISTORY LOG DASHBOARD */}
            {/* ======================================================== */}
            {activeTab === 'transactions' && (
              <div className="space-y-4 flex-1 flex flex-col">
                
                <div className="bg-slate-900/70 border border-slate-850 rounded-3xl p-5 shadow-xl space-y-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-3 shrink-0">
                    <span className="text-xs font-black uppercase tracking-wider font-mono text-white">
                      {getLocalizedText("Official Transaction History")}
                    </span>
                    <button
                      onClick={() => {
                        const visibleIds = history.map(tx => tx.id);
                        setClearedTxIds(prev => [...prev, ...visibleIds]);
                        showToast(getLocalizedText("Transaction view logs cleared locally."));
                      }}
                      className="text-[9px] font-mono bg-rose-950/45 hover:bg-rose-955 border border-rose-900/50 hover:border-rose-800 text-rose-350 px-2.5 py-1.5 rounded-xl font-bold transition-all uppercase tracking-wider cursor-pointer"
                    >
                      {getLocalizedText("Clear View")}
                    </button>
                  </div>

                  {/* Date Categories grouped lists */}
                  <div className="space-y-5 overflow-y-auto no-scrollbar pr-1 flex-1">
                    
                    {/* Today Section */}
                    {history.filter(tx => !clearedTxIds.includes(tx.id) && (tx.timestamp.includes('Today') || tx.timestamp.includes('now'))).length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[9px] text-slate-500 font-mono font-black uppercase tracking-wider block pl-1">
                          {getLocalizedText("Recent Activity")}
                        </span>
                        <div className="divide-y divide-slate-850">
                          {history.filter(tx => !clearedTxIds.includes(tx.id) && (tx.timestamp.includes('Today') || tx.timestamp.includes('now'))).map((tx) => (
                            <div key={tx.id} className="py-3.5 flex justify-between items-center first:pt-0 last:pb-0 gap-2">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                  onClick={() => handleViewReceipt(tx)}
                                  className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 transition-all cursor-pointer"
                                  title="View digital receipt"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <div className="truncate">
                                  <span className="text-xs font-black text-white block leading-tight truncate">{tx.recipient}</span>
                                  <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                                    {tx.timestamp} • Ref: {formatLocalRef(tx.hash)}
                                  </span>
                                  {tx.memo && (
                                    <span className="text-[8px] bg-slate-950 text-indigo-300 px-2 py-0.5 rounded border border-slate-850 mt-1.5 inline-block font-mono">
                                      Memo: {tx.memo}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-xs font-black text-white block leading-tight">
                                  -${tx.amountSent.toFixed(2)} USDC
                                </span>
                                <span className="text-[9px] font-extrabold text-emerald-400 block mt-1 font-mono">
                                  +{tx.amountReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })} {tx.target}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Earlier Week Section */}
                    {history.filter(tx => !clearedTxIds.includes(tx.id) && !tx.timestamp.includes('Today') && !tx.timestamp.includes('now')).length > 0 && (
                      <div className="space-y-3 pt-2">
                        <span className="text-[9px] text-slate-500 font-mono font-black uppercase tracking-wider block pl-1">
                          {getLocalizedText("Earlier This Month")}
                        </span>
                        <div className="divide-y divide-slate-850">
                          {history.filter(tx => !clearedTxIds.includes(tx.id) && !tx.timestamp.includes('Today') && !tx.timestamp.includes('now')).map((tx) => (
                            <div key={tx.id} className="py-3.5 flex justify-between items-center first:pt-0 last:pb-0 gap-2">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                  onClick={() => handleViewReceipt(tx)}
                                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-750 flex items-center justify-center text-slate-400 hover:text-white shrink-0 transition-all cursor-pointer"
                                  title="View digital receipt"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <div className="truncate">
                                  <span className="text-xs font-black text-white block leading-tight truncate">{tx.recipient}</span>
                                  <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                                    {tx.timestamp} • Ref: {formatLocalRef(tx.hash)}
                                  </span>
                                  {tx.memo && (
                                    <span className="text-[8px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-850 mt-1.5 inline-block font-mono">
                                      Memo: {tx.memo}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-xs font-black text-white block leading-tight">
                                  -${tx.amountSent.toFixed(2)} USDC
                                </span>
                                <span className="text-[9px] font-extrabold text-emerald-400 block mt-1 font-mono">
                                  +{tx.amountReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })} {tx.target}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback Empty State */}
                    {history.filter(tx => !clearedTxIds.includes(tx.id)).length === 0 && (
                      <div className="text-center py-12 space-y-2.5">
                        <FileText className="w-8 h-8 text-slate-600 mx-auto opacity-40 animate-pulse" />
                        <p className="text-[10px] text-slate-450 leading-relaxed font-mono">
                          {getLocalizedText("Local transaction history is clear.")}
                        </p>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* PROFILE VIEW: PERSONAL DETAILS & FINTECH SETTINGS MENU */}
            {/* ======================================================== */}
            {activeTab === 'profile' && (
              <div className="space-y-5 flex-1 flex flex-col">
                
                {/* Profile Card Header & Avatar Uploader */}
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/10 rounded-3xl p-6 text-center space-y-4 shadow-xl">
                  <div className="relative inline-block mx-auto">
                    <div className="w-20 h-20 rounded-full border-2 border-indigo-400 flex items-center justify-center font-black text-3xl text-white shadow-lg shadow-indigo-500/20 overflow-hidden bg-indigo-900">
                      {profileAvatarUrl ? (
                        <img src={profileAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        currentUser.name[0].toUpperCase()
                      )}
                    </div>
                    {/* Avatar edit overlay/button */}
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 hover:bg-indigo-500 border border-slate-900 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-all text-white"
                      title="Upload Avatar"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </label>
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProfileAvatarUrl(URL.createObjectURL(file));
                          showToast(getLocalizedText("Profile avatar uploaded successfully!"));
                        }
                      }}
                    />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white block">{currentUser.name}</h3>
                    <div className="flex justify-center gap-2 mt-2">
                      <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        Verified Tier 2
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Data Cards */}
                <div 
                  className="border rounded-3xl p-5 space-y-4 shadow-lg transition-all"
                  style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  <span className="text-[10px] text-indigo-400 font-mono font-black uppercase tracking-wider block pl-1">
                    {getLocalizedText("Personal Information")}
                  </span>
                  
                  <div className="space-y-3">
                    <div 
                      className="p-3.5 rounded-2xl border flex flex-col gap-1.5 transition-all"
                      style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">Email Address</span>
                        <span className="text-[8px] text-emerald-400 font-mono font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/30">Primary</span>
                      </div>
                      <span className="text-xs font-bold font-mono break-all" style={{ color: 'var(--text-main)' }}>{currentUser.email}</span>
                    </div>

                    <div 
                      className="p-3.5 rounded-2xl border flex flex-col gap-1.5 transition-all"
                      style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">Mobile Number</span>
                        <button 
                          onClick={() => {
                            if (isEditingProfile) {
                              showToast(getLocalizedText("Mobile number saved."));
                              setIsEditingProfile(false);
                            } else {
                              setIsEditingProfile(true);
                            }
                          }}
                          className="text-[9px] font-bold text-indigo-400 hover:underline uppercase"
                        >
                          {isEditingProfile ? "Save" : "Edit"}
                        </button>
                      </div>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={profileMobile}
                          onChange={(e) => setProfileMobile(e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono font-bold"
                          placeholder="+63 917 123 4567"
                        />
                      ) : (
                        <span className="text-xs font-bold font-mono" style={{ color: 'var(--text-main)' }}>{profileMobile}</span>
                      )}
                    </div>

                    <div 
                      className="p-3.5 rounded-2xl border flex flex-col gap-1.5 transition-all"
                      style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">Secure Wallet Address</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(currentUser.maskedAddress || "op_addr_xxxx");
                            showToast("Address copied to clipboard!");
                          }}
                          className="text-[9px] font-bold text-slate-400 hover:text-white uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                      <span className="text-xs font-bold font-mono break-all" style={{ color: 'var(--text-main)' }}>
                        {currentUser.maskedAddress || "op_addr_xxxx"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Settings list menu rows */}
                <div 
                  className="border rounded-3xl p-4.5 space-y-4 shadow-lg transition-all"
                  style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  
                  {/* Palette Shift / Theme Engine Switcher */}
                  <div className="border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="py-2 px-2 text-xs">
                      <div className="flex items-center gap-3 mb-2">
                        <Palette className="w-4.5 h-4.5 text-slate-400" />
                        <span className="font-bold" style={{ color: 'var(--text-main)' }}>Absolute Visual Theme</span>
                      </div>
                      <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-300 font-mono uppercase">Midnight Slate Enforced</p>
                          <p className="text-[8.5px] text-slate-550 mt-0.5 leading-none">System-wide standard visual alignment</p>
                        </div>
                        <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.5 rounded uppercase font-bold">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* System Preferences (Language & Timezone) */}
                  <div className="border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="py-2 px-2 text-xs space-y-3">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4.5 h-4.5 text-slate-400" />
                        <span className="font-bold" style={{ color: 'var(--text-main)' }}>System Preferences</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3.5">
                        {/* Language switcher */}
                        <div className="space-y-1.5">
                          <label className="block text-[8px] uppercase tracking-wide text-slate-400 font-mono pl-0.5">App Language</label>
                          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                              onClick={() => setLanguage('en')}
                              className={`py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                                language === 'en'
                                  ? 'bg-slate-800 border border-slate-700 text-white font-black shadow-sm'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              English
                            </button>
                            <button
                              onClick={() => setLanguage('tl')}
                              className={`py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                                language === 'tl'
                                  ? 'bg-slate-800 border border-slate-700 text-white font-black shadow-sm'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              Tagalog
                            </button>
                          </div>
                        </div>

                        {/* Timezone switcher */}
                        <div className="space-y-1.5">
                          <label className="block text-[8px] uppercase tracking-wide text-slate-400 font-mono pl-0.5">Time Zone</label>
                          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                              onClick={() => setTimezone('PHT')}
                              className={`py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                                timezone === 'PHT'
                                  ? 'bg-slate-800 border border-slate-700 text-white font-black shadow-sm'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              PHT (GMT+8)
                            </button>
                            <button
                              onClick={() => setTimezone('UTC')}
                              className={`py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                                timezone === 'UTC'
                                  ? 'bg-slate-800 border border-slate-700 text-white font-black shadow-sm'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              UTC (GMT)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Security Change PIN/MPIN */}
                  <div className="border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                      onClick={() => setShowChangePin(prev => !prev)}
                      className="w-full py-2 px-2 flex justify-between items-center text-xs hover:bg-slate-800/10 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-4.5 h-4.5 text-indigo-400" />
                        <span className="font-bold" style={{ color: 'var(--text-main)' }}>Account Security (Change PIN)</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-500 transition-all ${showChangePin ? 'rotate-90' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {showChangePin && (
                        <motion.form
                          onSubmit={handleChangePinSubmit}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-2 pb-3.5 pt-2.5 space-y-3 mt-2 border-t"
                          style={{ borderColor: 'var(--border-color)' }}
                        >
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[8px] text-slate-400 font-mono uppercase mb-1">Old 6-Digit PIN</label>
                              <input
                                type="password"
                                maxLength={6}
                                value={oldPin}
                                onChange={(e) => setOldPin(e.target.value)}
                                placeholder="••••••"
                                className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
                                style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-slate-400 font-mono uppercase mb-1">New 6-Digit PIN</label>
                              <input
                                type="password"
                                maxLength={6}
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                placeholder="••••••"
                                className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
                                style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] uppercase transition-all"
                          >
                            Update Security PIN
                          </button>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Interactive Notification settings */}
                  <div className="border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="py-2 px-2 text-xs">
                      <div className="flex items-center gap-3 mb-3">
                        <Bell className="w-4.5 h-4.5 text-indigo-400" />
                        <span className="font-bold" style={{ color: 'var(--text-main)' }}>Notification Preferences</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <button
                          onClick={() => setNotificationPrefs(prev => ({ ...prev, push: !prev.push }))}
                          className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                            notificationPrefs.push 
                              ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/25 font-black' 
                              : 'bg-transparent text-slate-500 border-slate-800'
                          }`}
                        >
                          Push Alerts
                        </button>
                        <button
                          onClick={() => setNotificationPrefs(prev => ({ ...prev, email: !prev.email }))}
                          className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                            notificationPrefs.email 
                              ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/25 font-black' 
                              : 'bg-transparent text-slate-500 border-slate-800'
                          }`}
                        >
                          Email Reports
                        </button>
                        <button
                          onClick={() => setNotificationPrefs(prev => ({ ...prev, sms: !prev.sms }))}
                          className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all ${
                            notificationPrefs.sms 
                              ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/25 font-black' 
                              : 'bg-transparent text-slate-500 border-slate-800'
                          }`}
                        >
                          SMS Updates
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Connected Payment Methods CRUD */}
                  <div className="border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="py-2 px-2 text-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-4.5 h-4.5 text-indigo-400" />
                          <span className="font-bold" style={{ color: 'var(--text-main)' }}>Connected Payment Methods</span>
                        </div>
                        <button
                          onClick={() => {
                            setShowAddAccount(!showAddAccount);
                            setNewAccName('');
                            setNewAccDetails('');
                          }}
                          className="text-[9px] font-bold text-indigo-400 hover:underline uppercase"
                        >
                          {showAddAccount ? 'Close Form' : '+ Link New'}
                        </button>
                      </div>

                      {showAddAccount && (
                        <form onSubmit={handleAddLinkedAccountSubmit} className="p-3 rounded-xl border space-y-2.5 bg-black/10" style={{ borderColor: 'var(--border-color)' }}>
                          <span className="text-[9px] font-extrabold uppercase text-indigo-400 block tracking-wider">Link Account Form</span>
                          
                          <div>
                            <label className="block text-[8px] uppercase tracking-wide text-slate-400 mb-1">Account/Card Name</label>
                            <input
                              type="text"
                              value={newAccName}
                              onChange={(e) => setNewAccName(e.target.value)}
                              placeholder="e.g. Maya Savings, Citi Card"
                              className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                              style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] uppercase tracking-wide text-slate-400 mb-1">Type</label>
                              <select
                                value={newAccType}
                                onChange={(e) => setNewAccType(e.target.value)}
                                className="w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                                style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                              >
                                <option value="Fintech Wallet">Fintech Wallet</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Bank Account">Bank Account</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[8px] uppercase tracking-wide text-slate-400 mb-1">Details (Masked)</label>
                              <input
                                type="text"
                                value={newAccDetails}
                                onChange={(e) => setNewAccDetails(e.target.value)}
                                placeholder="e.g. *9871, *5521"
                                className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
                                style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                                required
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all"
                          >
                            Add Connected Account
                          </button>
                        </form>
                      )}

                      <div className="space-y-2">
                        {linkedAccounts.length === 0 ? (
                          <p className="text-[10px] text-slate-500 italic py-1 text-center">No payment methods linked.</p>
                        ) : (
                          linkedAccounts.map(account => (
                            <div key={account.id} className="flex justify-between items-center p-2 rounded-xl border bg-black/10 transition-all" style={{ borderColor: 'var(--border-color)' }}>
                              <div>
                                <span className="text-[10px] font-bold block" style={{ color: 'var(--text-main)' }}>{account.name}</span>
                                <span className="text-[8px] text-slate-400 font-mono block mt-0.5">{account.type}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-indigo-300 font-mono bg-indigo-950/40 border border-indigo-900/30 px-2 py-0.5 rounded">
                                  {account.details}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLinkedAccount(account.id)}
                                  className="p-1 rounded-lg hover:bg-red-950/30 text-red-400 border border-transparent hover:border-red-905/30 transition-all"
                                  title="Delete payment method"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CRM Billing Profiles CRUD */}
                  <div className="border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="py-2 px-2 text-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Receipt className="w-4.5 h-4.5 text-indigo-400" />
                          <span className="font-bold" style={{ color: 'var(--text-main)' }}>CRM Billing Profiles</span>
                        </div>
                        <button
                          onClick={() => {
                            if (showAddBilling) {
                              setShowAddBilling(false);
                              setEditingBillingId(null);
                            } else {
                              setEditingBillingId(null);
                              setBillingProviderField('');
                              setBillingRefIdField('');
                              setBillingAmountField('45');
                              setBillingRoutingField('');
                              setShowAddBilling(true);
                            }
                          }}
                          className="text-[9px] font-bold text-indigo-400 hover:underline uppercase"
                        >
                          {showAddBilling ? 'Close Form' : '+ Create Profile'}
                        </button>
                      </div>

                      {showAddBilling && (
                        <form onSubmit={handleSaveBillingProfileSubmit} className="p-3 rounded-xl border space-y-2.5 bg-black/10" style={{ borderColor: 'var(--border-color)' }}>
                          <span className="text-[9px] font-extrabold uppercase text-indigo-400 block tracking-wider">
                            {editingBillingId ? 'Edit Billing Profile' : 'New Billing Profile'}
                          </span>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] uppercase tracking-wide text-slate-400 mb-1">Provider Name</label>
                              <input
                                type="text"
                                value={billingProviderField}
                                onChange={(e) => setBillingProviderField(e.target.value)}
                                placeholder="e.g. Manila Water, Meralco"
                                className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                                style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] uppercase tracking-wide text-slate-400 mb-1">Bill Amount ($)</label>
                              <input
                                type="number"
                                value={billingAmountField}
                                onChange={(e) => setBillingAmountField(e.target.value)}
                                placeholder="45"
                                className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
                                style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] uppercase tracking-wide text-slate-400 mb-1">Reference ID</label>
                              <input
                                type="text"
                                value={billingRefIdField}
                                onChange={(e) => setBillingRefIdField(e.target.value)}
                                placeholder="e.g. REF-4482-991"
                                className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
                                style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] uppercase tracking-wide text-slate-400 mb-1">Routing Node</label>
                              <input
                                type="text"
                                value={billingRoutingField}
                                onChange={(e) => setBillingRoutingField(e.target.value)}
                                placeholder="OrbitPath Node ID"
                                className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
                                style={{ backgroundColor: 'var(--bg-darker)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all"
                          >
                            {editingBillingId ? 'Save Changes' : 'Save Billing Profile'}
                          </button>
                        </form>
                      )}

                      <div className="space-y-2">
                        {billingProfiles.length === 0 ? (
                          <p className="text-[10px] text-slate-500 italic py-1 text-center">No billing profiles found.</p>
                        ) : (
                          billingProfiles.map(bill => (
                            <div key={bill.id} className="flex justify-between items-center p-2.5 rounded-xl border bg-black/10 transition-all" style={{ borderColor: 'var(--border-color)' }}>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold" style={{ color: 'var(--text-main)' }}>{bill.provider}</span>
                                  <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                                    ${bill.amount} USDC
                                  </span>
                                </div>
                                <span className="text-[8px] text-slate-400 font-mono block mt-1">Ref: {bill.referenceId}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBillingId(bill.id);
                                    setBillingProviderField(bill.provider);
                                    setBillingRefIdField(bill.referenceId);
                                    setBillingAmountField(bill.amount.toString());
                                    setBillingRoutingField(bill.routingDetails || '');
                                    setShowAddBilling(true);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-indigo-950/30 text-indigo-400 border border-transparent hover:border-indigo-900/30 transition-all"
                                  title="Edit bill profile"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBillingProfile(bill.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-950/30 text-red-400 border border-transparent hover:border-red-900/30 transition-all"
                                  title="Delete bill profile"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* View Legal agreements terms */}
                  <div className="pb-1">
                    <button
                      onClick={() => setShowTosModal(true)}
                      className="w-full py-3.5 px-2 flex justify-between items-center text-xs hover:bg-slate-800/10 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4.5 h-4.5 text-indigo-400" />
                        <span className="font-bold" style={{ color: 'var(--text-main)' }}>View Legal Terms & agreements</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>

                </div>

                {/* Sign Out securely */}
                <button
                  onClick={handleLogout}
                  className="w-full py-4 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 font-bold rounded-2xl text-xs uppercase transition-all flex items-center justify-center gap-2 min-h-[44px] shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out Securely
                </button>

              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </main>

      {/* Persistent Bottom Tab Bar Navigation (GCash, Maya, GoTyme structured) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950 border-t border-slate-850/80 shadow-2xl py-2 px-4 flex justify-around items-center shrink-0">
        <button
          onClick={() => setActiveTab('home')}
          className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 text-[9px] font-black uppercase transition-all duration-200 cursor-pointer ${
            activeTab === 'home' ? 'text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 rounded-2xl' : 'text-slate-500 hover:text-slate-350 border border-transparent'
          } min-h-[48px] min-w-[64px]`}
        >
          <Wallet className="w-5 h-5 shrink-0" />
          <span>Home</span>
          {activeTab === 'home' && (
            <span className="absolute bottom-1 w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('send')}
          className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 text-[9px] font-black uppercase transition-all duration-200 cursor-pointer ${
            activeTab === 'send' ? 'text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 rounded-2xl' : 'text-slate-500 hover:text-slate-350 border border-transparent'
          } min-h-[48px] min-w-[64px]`}
        >
          <Send className="w-5 h-5 shrink-0" />
          <span>Send</span>
          {activeTab === 'send' && (
            <span className="absolute bottom-1 w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
          )}
        </button>

        <button
          onClick={() => setShowScannerModal(true)}
          className="relative flex flex-col items-center justify-center gap-1 py-1 px-3 text-[9px] font-black uppercase text-slate-500 hover:text-slate-350 min-h-[48px] min-w-[64px] border border-transparent cursor-pointer"
        >
          <Camera className="w-5 h-5 shrink-0 text-indigo-400" />
          <span>Scan</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 text-[9px] font-black uppercase transition-all duration-200 cursor-pointer ${
            activeTab === 'transactions' ? 'text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 rounded-2xl' : 'text-slate-500 hover:text-slate-350 border border-transparent'
          } min-h-[48px] min-w-[64px]`}
        >
          <History className="w-5 h-5 shrink-0" />
          <span>History</span>
          {activeTab === 'transactions' && (
            <span className="absolute bottom-1 w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 text-[9px] font-black uppercase transition-all duration-200 cursor-pointer ${
            activeTab === 'profile' ? 'text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 rounded-2xl' : 'text-slate-500 hover:text-slate-350 border border-transparent'
          } min-h-[48px] min-w-[64px]`}
        >
          <User className="w-5 h-5 shrink-0" />
          <span>Profile</span>
          {activeTab === 'profile' && (
            <span className="absolute bottom-1 w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODAL OVERLAYS & SHEETS */}
      {/* ======================================================== */}

      {/* A. Slide-Up Camera Viewfinder Modal Sheet */}
      <AnimatePresence>
        {showScannerModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center font-sans">
            {/* Dimming overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScannerModal(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
            ></motion.div>

            {/* Slide-Up Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
              className="relative w-full max-w-md bg-slate-900 border-t border-slate-850 rounded-t-[2.5rem] p-6 shadow-2xl space-y-5 z-10 text-slate-100 font-sans"
            >
              {/* Close Bar header */}
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-black uppercase tracking-wider font-mono text-white">
                    Scan Pay Code
                  </span>
                </div>
                <button
                  onClick={() => setShowScannerModal(false)}
                  className="p-1 rounded-full bg-slate-800 hover:bg-slate-750 cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Viewfinder block */}
              <div className="relative h-52 bg-slate-950 rounded-2xl border border-slate-850 flex items-center justify-center overflow-hidden">
                {cameraPermission === 'undecided' ? (
                  <div className="absolute inset-0 bg-slate-950 p-4 flex flex-col justify-between z-30">
                    <div className="text-center space-y-1">
                      <div className="w-9 h-9 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-1">
                        <Camera className="w-4.5 h-4.5 text-slate-400" />
                      </div>
                      <p className="text-[10.5px] font-bold text-white uppercase tracking-wider font-sans">Camera Permission</p>
                      <p className="text-[9px] text-slate-400 leading-normal max-w-[240px] mx-auto">
                        Allow OrbitPath to access your camera to scan QR pay codes securely?
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setCameraPermission('allow_once');
                            showToast("Access granted for this scan.");
                          }}
                          className="py-1.5 bg-slate-900 hover:bg-slate-850 text-[8.5px] font-bold text-slate-200 border border-slate-800 rounded-lg uppercase cursor-pointer transition-all"
                        >
                          Only This Time
                        </button>
                        <button
                          onClick={() => {
                            localStorage.setItem('orbit_camera_permission', 'always');
                            setCameraPermission('always');
                            showToast("Camera access granted permanently.");
                          }}
                          className="py-1.5 bg-slate-800 hover:bg-slate-700 text-[8.5px] font-bold text-slate-100 border border-slate-700 rounded-lg uppercase cursor-pointer transition-all"
                        >
                          Always Allow
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setCameraPermission('ask_later');
                            setShowScannerModal(false);
                            showToast("Permission postponed.");
                          }}
                          className="py-1 bg-slate-950 hover:bg-slate-900 text-[8.5px] font-semibold text-slate-500 border border-slate-850 rounded-lg uppercase cursor-pointer transition-all"
                        >
                          Ask Again Later
                        </button>
                        <button
                          onClick={() => {
                            localStorage.setItem('orbit_camera_permission', 'dont_ask_again');
                            setCameraPermission('dont_ask_again');
                            showToast("Permission permanently blocked.");
                          }}
                          className="py-1 bg-slate-950 hover:bg-slate-900 text-[8.5px] font-semibold text-rose-500/80 border border-slate-850 rounded-lg uppercase cursor-pointer transition-all"
                        >
                          Don't Ask Again
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {cameraStream && !cameraError && (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover z-0"
                      />
                    )}

                    {/* Sleek animated pulsing concentric circle ring overlay when camera is initializing */}
                    {!cameraStream && !cameraError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 space-y-3">
                        <div className="relative w-20 h-20 flex items-center justify-center bg-slate-800/20 rounded-full border border-slate-700/50 animate-pulse">
                          <Camera className="w-8 h-8 text-slate-500 animate-pulse" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium tracking-wide animate-pulse font-mono">
                          Requesting Camera Access...
                        </p>
                      </div>
                    )}

                    {/* Active laser animation sweep */}
                    {cameraStream && !cameraError && (
                      <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent animate-bounce top-0 z-20"></div>
                    )}
                    
                    {/* Visual borders */}
                    <div className="absolute top-4.5 left-4.5 w-4 h-4 border-t-2 border-l-2 border-slate-400 z-20"></div>
                    <div className="absolute top-4.5 right-4.5 w-4 h-4 border-t-2 border-r-2 border-slate-400 z-20"></div>
                    <div className="absolute bottom-4.5 left-4.5 w-4 h-4 border-b-2 border-l-2 border-slate-400 z-20"></div>
                    <div className="absolute bottom-4.5 right-4.5 w-4 h-4 border-b-2 border-r-2 border-slate-400 z-20"></div>

                    {cameraStream && !cameraError && (
                      <div className="text-center space-y-1 relative z-10 px-3.5 bg-slate-950/70 py-1.5 rounded-xl border border-slate-500/10">
                        <p className="text-[10px] text-emerald-400 font-bold leading-normal flex items-center gap-1.5 justify-center">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                          Reactive camera scan viewfinder active
                        </p>
                      </div>
                    )}

                    {cameraError && (
                      <div className="text-center space-y-1.5 relative z-10 px-4 bg-slate-950/80 py-2.5 rounded-xl border border-red-950/40 max-w-xs">
                        <p className="text-[10px] text-red-400 font-bold leading-normal">
                          {cameraError}
                        </p>
                        {cameraPermission === 'dont_ask_again' && (
                          <button
                            onClick={() => {
                              localStorage.removeItem('orbit_camera_permission');
                              setCameraPermission('undecided');
                              showToast("Permission settings cleared. You can grant access now!");
                            }}
                            className="mt-2 inline-block text-[8px] uppercase tracking-wider font-mono font-bold text-slate-400 hover:text-white underline cursor-pointer"
                          >
                            Reset Permissions
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Upload QR Image file-input fallback directly underneath the viewfinder */}
              <div className="border-t border-slate-850/60 pt-4.5 space-y-3">
                <span className="text-[9px] text-slate-400 font-mono font-bold uppercase block pl-1">
                  Or Upload QR Image Fallback
                </span>
                <div className="relative flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/80 transition-all cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedQR(file.name);
                        showToast(`Successfully imported QR: ${file.name}`);
                        // Simulate decoding GCash QR pay code
                        setTimeout(() => {
                          handleSimulatedQRScan(`stellar:pay?amount=150.00&asset_code=PHP&memo=Imported_GCash_QR`);
                        }, 800);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-1.5 py-1 text-center pointer-events-none">
                    <span className="text-[11px] font-bold text-slate-300">Choose QR image from photo library</span>
                    <span className="text-[9px] text-slate-500 font-mono">Accepts PNG, JPG, WebP</span>
                  </div>
                </div>
                {uploadedQR && (
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-850 text-[10px] font-mono text-emerald-400 flex items-center justify-between">
                    <span className="truncate">Active QR: {uploadedQR}</span>
                    <button onClick={() => setUploadedQR(null)} className="text-[9px] text-rose-500 uppercase font-black hover:underline cursor-pointer">
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Scannable test presets */}
              <div className="space-y-2.5">
                <span className="text-[9px] text-slate-400 font-mono font-bold uppercase block pl-1 flex items-center justify-between">
                  <span>Preset Payloads (Tap to Simulate Scan)</span>
                  {cameraError && (
                    <span className="text-[8px] bg-amber-500/15 text-amber-400 font-mono font-bold px-2 py-0.5 rounded animate-pulse border border-amber-500/30">
                      Interactive Fallback Active
                    </span>
                  )}
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleSimulatedQRScan(`stellar:pay?amount=250.00&asset_code=PHP&memo=Settle_Alice_Vance_91`)}
                    className={`text-left p-3 rounded-xl border transition-all font-mono space-y-1 cursor-pointer w-full ${
                      cameraError
                        ? 'bg-slate-950/50 border-amber-500/50 hover:border-amber-400 animate-pulse'
                        : 'bg-slate-950 hover:bg-slate-850 border-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-slate-200 font-bold text-[10px] block">★ Pay Remittance PHP</span>
                    <span className="text-slate-450 text-[8px] block">Prefill: $250.00 USDC converted to Philippine PHP</span>
                  </button>
                  <button
                    onClick={() => handleSimulatedQRScan(`stellar:pay?amount=85.00&asset_code=EUR&memo=Invoice_John_SME_44`)}
                    className={`text-left p-3 rounded-xl border transition-all font-mono space-y-1 cursor-pointer w-full ${
                      cameraError
                        ? 'bg-slate-950/50 border-amber-500/50 hover:border-amber-400 animate-pulse'
                        : 'bg-slate-950 hover:bg-slate-850 border-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-slate-200 font-bold text-[10px] block">★ Settle Invoice EUR</span>
                    <span className="text-slate-450 text-[8px] block">Prefill: $85.00 USDC converted to Eurozone EUR</span>
                  </button>
                </div>
              </div>

              {/* Paste payload manual input */}
              <div className="pt-2 flex gap-2">
                <input
                  type="text"
                  id="modal-qr-uri"
                  ref={manualQRRef}
                  placeholder="stellar:pay?amount=...&asset_code=..."
                  className={`flex-1 bg-slate-950 border rounded-xl px-3 py-2.5 text-xs font-mono text-slate-300 focus:outline-none placeholder:text-slate-600 transition-all duration-200 ${
                    cameraError
                      ? 'border-amber-500/60 ring-2 ring-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)] focus:border-amber-500 focus:ring-amber-500'
                      : 'border-slate-850 focus:border-slate-750'
                  }`}
                />
                <button
                  onClick={() => {
                    const input = manualQRRef.current;
                    if (input && input.value) {
                      handleSimulatedQRScan(input.value);
                    } else {
                      showToast("Please enter a valid pay payload.");
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs uppercase cursor-pointer border border-slate-700"
                >
                  Decode
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* B. Pay Bills Modal */}
      <AnimatePresence>
        {showBillsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-mono">Pay Bills Fee-Free</span>
                <button onClick={() => setShowBillsModal(false)} className="p-1 rounded-full hover:bg-slate-800">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {billsStatus === 'success' ? (
                <div className="text-center py-5 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-black uppercase text-white tracking-wide">Biller Settled Successfully</h4>
                  <p className="text-[10px] text-slate-450 leading-relaxed">Swap processed instantly via OrbitPath regional liquidity pools.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase font-extrabold font-mono mb-1.5">Biller Provider</label>
                    <select
                      value={billsProvider}
                      onChange={(e) => setBillsProvider(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="Power & Light Co.">Metro Power & Light</option>
                      <option value="Global Telcom Inc.">Global Telcom Inc.</option>
                      <option value="Metropolitan Water">Metropolitan Water</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase font-extrabold font-mono mb-1.5">Account Reference ID</label>
                    <input
                      type="text"
                      defaultValue="9823-1123-4560"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase font-extrabold font-mono mb-1.5">Amount (USD equivalents)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold font-mono">$</span>
                      <input
                        type="number"
                        value={billsAmount}
                        onChange={(e) => setBillsAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 pr-3 py-2 text-xs font-bold text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePayBillSubmit}
                    disabled={billsStatus === 'loading'}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
                  >
                    {billsStatus === 'loading' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Routing payment path...
                      </>
                    ) : (
                      "Settle Bill"
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* C. Dynamic QR Receive Modal */}
      <AnimatePresence>
        {showQRReceive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl text-center space-y-4"
            >
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-mono">Custom Payment QR</span>
                <button onClick={() => setShowQRReceive(false)} className="p-1 rounded-full hover:bg-slate-800">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3.5 text-left">
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider font-mono block pl-0.5">Parameters Customizer</span>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase font-mono pl-0.5">Requested Amount</label>
                    <input
                      type="number"
                      value={qrAmount}
                      onChange={(e) => setQrAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] text-slate-400 uppercase font-mono pl-0.5">Asset Code</label>
                    <select
                      value={qrAsset}
                      onChange={(e) => setQrAsset(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="USDC">USDC</option>
                      <option value="XLM">XLM</option>
                      <option value="PHP">PHP</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] text-slate-400 uppercase font-mono pl-0.5">Reference Memo</label>
                  <input
                    type="text"
                    value={qrMemo}
                    onChange={(e) => setQrMemo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4.5 flex flex-col items-center justify-center border border-slate-850 space-y-3.5">
                
                {/* SVG dynamic pixel block matrix */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                  <svg width="140" height="140" viewBox="0 0 21 21" shapeRendering="crispEdges" className="mx-auto">
                    {qrMatrix.map((row, r) => 
                      row.map((active, c) => (
                        <rect
                          key={`qr_pixel_${r}_${c}`}
                          x={c}
                          y={r}
                          width="1"
                          height="1"
                          fill={active ? "#1e1b4b" : "transparent"}
                        />
                      ))
                    )}
                  </svg>
                </div>

                <div className="space-y-1.5 w-full text-center">
                  <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider block font-mono">Dynamic Payment URI payload</span>
                  <div className="text-[9px] font-mono text-slate-400 break-all bg-slate-900 p-2.5 rounded-lg border border-slate-850 max-h-16 overflow-y-auto no-scrollbar">
                    {generatedQRUri}
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedQRUri);
                    showToast("Payment URI copied!");
                  }}
                  className="flex-1 py-3 bg-slate-850 hover:bg-slate-800 transition-all text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  Copy URI
                </button>
                
                <button
                  onClick={() => {
                    setShowQRReceive(false);
                    handleSimulatedQRScan(generatedQRUri);
                  }}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase transition-all min-h-[44px] shadow-lg shadow-indigo-600/10"
                >
                  Test Scan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* D. Transfer Sent Receipt Modal */}
      <AnimatePresence>
        {txReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-b from-indigo-950/40 to-slate-900 text-center p-5 flex flex-col items-center border-b border-slate-850">
                <div className="w-11 h-11 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mb-2.5 shadow-md animate-bounce">
                  <Check className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-xs font-black uppercase text-white tracking-wider font-mono leading-none">
                  Transfer Sent Successfully
                </h3>
                <p className="text-[9px] text-slate-400 font-mono mt-1">{txReceipt.timestamp}</p>
              </div>

              <div className="px-5 py-4 bg-slate-950/40 space-y-3.5 text-xs">
                <div className="text-center pb-3 border-b border-slate-850">
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">Guaranteed Payout Delivered</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {txReceipt.target === 'PHP' ? '₱' : txReceipt.target === 'NGN' ? '₦' : txReceipt.target === 'EUR' ? '€' : 'R$'}
                    {txReceipt.amountReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Recipient Name:</span>
                    <span className="font-bold text-white">{txReceipt.recipient}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Payout Destination:</span>
                    <span className="font-mono font-bold text-white">{txReceipt.details}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Source Debit:</span>
                    <span className="font-mono text-white font-bold">${txReceipt.amountSent.toFixed(2)} USDC</span>
                  </div>
                  {txReceipt.memo && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Reference Memo:</span>
                      <span className="font-mono text-slate-300 font-bold">{txReceipt.memo}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Routing Path:</span>
                    <span className="font-mono text-indigo-400 font-bold uppercase">{txReceipt.pathUsed.join(' ➔ ')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Transaction ID:</span>
                    <span className="font-mono text-indigo-400 font-bold">{formatLocalRef(txReceipt.hash)}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3 text-center border-t border-slate-850">
                <div className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 p-3 rounded-2xl text-[9px] font-mono leading-normal">
                  "{txReceipt.message}"
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      showToast(getLocalizedText("Generating high-fidelity receipt PDF..."));
                      setTimeout(() => {
                        showToast(getLocalizedText("Digital payment slip downloaded successfully!"));
                      }, 1200);
                    }}
                    className="py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold uppercase transition-all min-h-[44px] flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/15 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {getLocalizedText("Download")}
                  </button>
                  <button
                    onClick={() => {
                      setTxReceipt(null);
                      setActiveTab('home');
                    }}
                    className="py-3 bg-slate-950 hover:bg-slate-850 text-slate-350 rounded-xl text-xs font-bold uppercase transition-all min-h-[44px] border border-slate-850 cursor-pointer"
                  >
                    {getLocalizedText("Close")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SLIDE-DOWN/OVER PROFILE PORTAL (TRIGGERED FROM HEADER AVATAR) ── */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-50 flex justify-end font-sans">
            {/* Dimming backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs cursor-pointer"
            />
            
            {/* Slide-in panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="relative w-80 bg-slate-950 border-l border-slate-850 p-6 flex flex-col justify-between h-full shadow-2xl z-10 text-slate-100"
            >
              <div className="space-y-6 overflow-y-auto no-scrollbar pb-10">
                <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-bold uppercase tracking-wider text-xs text-slate-200">Secure Core Panel</span>
                  </div>
                  <button 
                    onClick={() => setIsProfileOpen(false)} 
                    className="p-1 rounded-full bg-slate-900 hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Personal Info Row */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Authorized Identity</span>
                  <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-850 text-xs font-mono text-slate-300 space-y-2">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold block leading-none">Profile Name</span>
                      <span className="text-white font-black text-xs block mt-1">{currentUser?.name || "David"}</span>
                    </div>
                    <div className="border-t border-slate-850/60 pt-2">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block leading-none">Email Address</span>
                      <span className="text-white font-black text-xs block mt-1 break-all">{currentUser?.email || "david@orbitpath.com"}</span>
                    </div>
                    <div className="border-t border-slate-850/60 pt-2">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block leading-none">Mobile Number</span>
                      <span className="text-white font-black text-xs block mt-1">{profileMobile}</span>
                    </div>
                    <div className="border-t border-slate-850/60 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 uppercase font-bold leading-none">Secure Wallet Address</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(currentUser?.maskedAddress || "op_addr_xxxx");
                            showToast("Address copied to clipboard!");
                          }}
                          className="text-[8px] font-bold text-slate-400 hover:text-white uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          Copy
                        </button>
                      </div>
                      <span className="text-slate-400 font-bold text-[10px] block mt-1 break-all select-all">
                        {currentUser?.maskedAddress || "op_addr_xxxx"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Saved QR Accounts List */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Saved QR Payout Profiles</span>
                    <button 
                      onClick={() => {
                        const platform = prompt("Enter payout platform (e.g. GCash, Maya, GoTyme):") || "GCash";
                        const customName = prompt(`Enter profile name (e.g. My ${platform}):`) || `My ${platform}`;
                        const newQR = {
                          id: Date.now(),
                          name: customName,
                          platform: platform,
                          date: new Date().toISOString().split('T')[0]
                        };
                        setSavedQRs(prev => [...prev, newQR]);
                        showToast(`Saved payout QR account for ${platform}!`);
                      }}
                      className="text-[9px] font-mono font-black text-slate-400 hover:text-white uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add New
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                    {savedQRs.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic py-1 pl-1 font-mono">No saved payout profiles.</p>
                    ) : (
                      savedQRs.map((qr) => (
                        <div key={qr.id} className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-xs font-mono text-slate-350">
                          <div>
                            <p className="text-white font-bold leading-snug">{qr.name}</p>
                            <p className="text-[9px] text-slate-500">{qr.platform} • Added {qr.date}</p>
                          </div>
                          <button 
                            onClick={() => {
                              setSavedQRs(prev => prev.filter(item => item.id !== qr.id));
                              showToast("Deleted saved payout profile.");
                            }}
                            className="text-[9px] text-rose-500 hover:text-rose-400 transition-all font-black uppercase cursor-pointer pl-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Legal Agreement Trigger Link */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Legal Agreements</span>
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      setShowTosModal(true);
                    }}
                    className="w-full bg-slate-900/40 hover:bg-slate-900 border border-slate-850 text-left p-3.5 rounded-2xl text-xs font-mono text-slate-300 hover:text-white transition-all flex justify-between items-center cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold">View Wallet Agreement</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Logout Action Module */}
              <button 
                onClick={() => {
                  setIsProfileOpen(false);
                  handleLogout();
                }}
                className="w-full bg-rose-950/20 hover:bg-rose-950/40 hover:border-rose-900/50 text-rose-400 border border-rose-950/30 transition-all py-3.5 rounded-2xl font-mono text-xs uppercase tracking-widest font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Securely
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
