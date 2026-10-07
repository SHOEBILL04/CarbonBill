import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  bn: {
    translation: {
      appName: 'কার্বনবিল',
      tagline: 'সহজ ও নির্ভুল এসএমই কার্বন রিপোর্টিং',
      roles: {
        FloorStaff: 'ফ্লোর স্টাফ',
        Accountant: 'হিসাবরক্ষক',
        Compliance: 'কমপ্লায়েন্স অফিসার',
        Owner: 'মালিক / পরিচালক',
        Consultant: 'কনসালট্যান্ট',
        PlatformAdmin: 'প্ল্যাটফর্ম অ্যাডমিন'
      },
      nav: {
        dashboard: 'ড্যাশবোর্ড',
        floorCapture: 'বিল আপলোড (ফ্লোর)',
        reviewQueue: 'রিভিউ কিউ',
        reports: 'রিপোর্ট',
        logout: 'লগআউট'
      },
      login: {
        title: 'লগইন করুন',
        emailPlaceholder: 'ইমেইল এড্রেস',
        passwordPlaceholder: 'পাসওয়ার্ড',
        submit: 'লগইন',
        orJoinQr: 'অথবা কিউআর (QR) কোড বা পিন দিয়ে যুক্ত হোন',
        joinPin: '৪-ডিজিট পিন দিয়ে যুক্ত হোন',
        pinPlaceholder: 'পিন কোড (যেমন: 1234)',
        tokenPlaceholder: 'ইনভাইট টোকেন',
        namePlaceholder: 'আপনার নাম',
        phonePlaceholder: 'মোবাইল নম্বর',
        joinSubmit: 'যুক্ত হোন',
        loginFailed: 'লগইন ব্যর্থ হয়েছে। ইমেইল বা পাসওয়ার্ড চেক করুন।'
      },
      floor: {
        title: 'রসিদ ও বিল আপলোড',
        subtitle: 'সহজ দুই-ট্যাপে আপনার বিল বা রসিদের ছবি তুলুন',
        categories: {
          diesel: 'ডিজেল / জ্বালানি',
          gas: 'গ্যাস বিল',
          electricity: 'বিদ্যুৎ বিল',
          shipment: 'চালান / পরিবহন'
        },
        tapToCapture: 'ছবি তুলতে ট্যাপ করুন',
        manualFallback: 'ছবি স্পষ্ট না হলে? সরাসরি সংখ্যা লিখুন',
        quantityLabel: 'পরিমাণ (লিটার / ইউনিট / টাকা)',
        slipNumber: 'রসিদ / স্লিপ নম্বর',
        submitReceipt: 'রসিদ জমা দিন',
        recentSubmissions: 'আমার সাম্প্রতিক আপলোড',
        receiptConfirmed: 'রসিদ সফলভাবে গৃহীত হয়েছে! আইডি:',
        offlineNotice: 'আপনি অফলাইনে আছেন। ইন্টারনেট আসলে স্বয়ংক্রিয়ভাবে জমা হবে।'
      },
      dashboard: {
        title: 'কার্বন ড্যাশবোর্ড',
        scope1: 'স্কোপ ১ (জ্বালানি ও গ্যাস)',
        scope2: 'স্কোপ ২ (বিদ্যুৎ)',
        scope3: 'স্কোপ ৩ (পরিবহন)',
        dataQualityScore: 'ডেটা কোয়ালিটি স্কোর (DQS)',
        topFlags: 'জরুরি নোটিশ / ফ্ল্যাগ',
        topActions: 'টাকা সাশ্রয়ী পদক্ষেপ',
        missingDocs: 'অনুপস্থিত বিল তালিকা',
        verifiedLabel: 'যাচাইকৃত (Verified)',
        estimatedLabel: 'আনুমানিক (Estimated)'
      }
    }
  },
  en: {
    translation: {
      appName: 'CarbonBill',
      tagline: 'Defensible SME Carbon Accounting',
      roles: {
        FloorStaff: 'Floor Staff',
        Accountant: 'Accountant',
        Compliance: 'Compliance Officer',
        Owner: 'Factory Owner',
        Consultant: 'Consultant',
        PlatformAdmin: 'Platform Admin'
      },
      nav: {
        dashboard: 'Dashboard',
        floorCapture: 'Floor Capture',
        reviewQueue: 'Review Queue',
        reports: 'Reports',
        logout: 'Logout'
      },
      login: {
        title: 'Sign In',
        emailPlaceholder: 'Email Address',
        passwordPlaceholder: 'Password',
        submit: 'Sign In',
        orJoinQr: 'Or Join via QR Token & PIN',
        joinPin: 'Join with PIN',
        pinPlaceholder: 'PIN code (e.g. 1234)',
        tokenPlaceholder: 'Invite Token',
        namePlaceholder: 'Your Full Name',
        phonePlaceholder: 'Phone Number',
        joinSubmit: 'Join Team',
        loginFailed: 'Authentication failed. Please check your credentials.'
      },
      floor: {
        title: 'Capture Bill / Slip',
        subtitle: 'Quick 2-tap photo submission for slips and bills',
        categories: {
          diesel: 'Diesel / Fuel',
          gas: 'Gas Bill',
          electricity: 'Electricity Bill',
          shipment: 'Shipment / Challan'
        },
        tapToCapture: 'Tap to Take Photo',
        manualFallback: 'Slip damaged or dark? Enter values manually',
        quantityLabel: 'Quantity (Litres / kWh / BDT)',
        slipNumber: 'Slip / Bill Number',
        submitReceipt: 'Submit Receipt',
        recentSubmissions: 'My Recent Submissions',
        receiptConfirmed: 'Receipt successfully confirmed! ID:',
        offlineNotice: 'You are offline. Uploads will sync automatically once connected.'
      },
      dashboard: {
        title: 'Carbon Dashboard',
        scope1: 'Scope 1 (Combustion)',
        scope2: 'Scope 2 (Grid Electricity)',
        scope3: 'Scope 3 (Freight)',
        dataQualityScore: 'Data Quality Score (DQS)',
        topFlags: 'Attention Required / Flags',
        topActions: 'Top Savings in BDT',
        missingDocs: 'Expected Documents Checklist',
        verifiedLabel: 'Verified',
        estimatedLabel: 'Estimated'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'bn', // Bangla first as specified
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
