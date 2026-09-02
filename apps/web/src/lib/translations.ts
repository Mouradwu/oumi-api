export const translations = {
  fr: {
    nav: {
      home: "Accueil",
      wilayas: "Wilayas",
      login: "Connexion",
      register: "S'inscrire",
    },
    hero: {
      title: "Sauvez des vies.",
      subtitle: "En temps réel.",
      description:
        "Plateforme qui connecte les donneurs de sang avec ceux qui en ont besoin, en temps réel.",
      ctaPrimary: "Devenir donneur",
      ctaSecondary: "Explorer",
    },
    stats: {
      wilayas: "Wilayas couvertes",
      donors: "Donneurs actifs",
      lives: "Vies sauvées",
    },
    features: {
      title: "Simple. Rapide. Vital.",
      items: [
        {
          icon: "⚡",
          title: "Urgence en temps réel",
          desc: "Alertes instantanées aux donneurs proches.",
        },
        {
          icon: "🛡️",
          title: "Donneurs vérifiés",
          desc: "Profils certifiés et historique médical sécurisé.",
        },
        {
          icon: "📍",
          title: "Géolocalisation",
          desc: "Trouvez le centre le plus proche en un clic.",
        },
      ],
    },
    footer: {
      tagline: "Ensemble, chaque goutte compte.",
      rights: "© 2026 Bloodz. Tous droits réservés.",
    },
  },
  ar: {
    nav: {
      home: "الرئيسية",
      wilayas: "الولايات",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
    },
    hero: {
      title: "أنقذ حياة.",
      subtitle: "في الوقت الفعلي.",
      description:
        "منصة تربط متبرعي الدم بمن يحتاجونه، في الوقت الفعلي.",
      ctaPrimary: "كن متبرعاً",
      ctaSecondary: "استكشف",
    },
    stats: {
      wilayas: "ولاية مغطاة",
      donors: "متبرع نشط",
      lives: "حياة تم إنقاذها",
    },
    features: {
      title: "بسيط. سريع. حيوي.",
      items: [
        {
          icon: "⚡",
          title: "طوارئ فورية",
          desc: "تنبيهات فورية للمتبرعين القريبين.",
        },
        {
          icon: "🛡️",
          title: "متبرعون موثقون",
          desc: "ملفات موثقة وسجل طبي آمن.",
        },
        {
          icon: "📍",
          title: "تحديد الموقع",
          desc: "اعثر على أقرب مركز بنقرة واحدة.",
        },
      ],
    },
    footer: {
      tagline: "معاً، كل قطرة تهم.",
      rights: "© 2026 أومي. جميع الحقوق محفوظة.",
    },
  },
};

export type Lang = "fr" | "ar";