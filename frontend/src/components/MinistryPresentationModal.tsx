import React, { useState } from "react";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  Layers, 
  Presentation, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Copy, 
  Check, 
  Volume2, 
  ExternalLink,
  Target,
  Maximize2,
  Minimize2,
  Users,
  Clock,
  Gauge,
  BrainCircuit,
  GraduationCap,
  Mic,
  Video,
  Globe2,
  AlertTriangle,
  Flame,
  FileText,
  DollarSign,
  Briefcase,
  PlayCircle,
  BarChart3,
  Bookmark,
  CheckCheck,
  Download,
  Printer,
  FileCode
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { IlqaaLogo } from "./IlqaaLogo";
import { generatePresentationHtml } from "../lib/presentationExport";

interface MinistryPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: "dashboard" | "practice" | "oratory" | "reports" | "talent" | "settings") => void;
  isRtl?: boolean;
}

export function MinistryPresentationModal({
  isOpen,
  onClose,
  onNavigateToTab,
  isRtl = true
}: MinistryPresentationModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedNote, setCopiedNote] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeVisualTab, setActiveVisualTab] = useState<"visual" | "data">("visual");

  if (!isOpen) return null;

  const slides = [
    {
      id: 1,
      badge: "الرؤية الوطنية والاستثمار الاستراتيجي | Vision 2030",
      badgeColor: "bg-[#8A1538]/30 border-[#D4AF37]/50 text-[#FDE68A]",
      title: "منظومة «إلقاء» للذكاء الاصطناعي الصوتي والخطابي",
      subtitle: "استثمار وطني استراتيجي لتمكين الجيل القادم من فصاحة اللسان، طلاقة البيان، والريادة الخطابية",
      category: "overview",
      speakerNotes: "أصحاب السعادة وممثلي وزارة التربية والتعليم والتعليم العالي، والسادة المستثمرين الأفاضل: نقف اليوم أمام فرصة تاريخية واستثمارية نوعية تجمع بين أحدث تقنيات الذكاء الاصطناعي التوليدي والصوتي، وبين حماية الهوية الوطنية اللغوية لدولة قطر. نضع بين أيديكم منظومة 'إلقاء'—المنصة الوطنية الأولى التي تحوّل وثيقة معايير مناهج اللغة العربية (2018) إلى مدرب صوتي ومنبر تفاعلي متاح لكل طالب 24/7.",
      kpis: [
        { label: "100% تطابق المناهج", val: "معايير قطر 2018", sub: "من الروضة إلى الصف 12" },
        { label: "دقة المعالجة الصوتية", val: "< 180 ms", sub: "تحليل الحركات ومخارج الحروف" },
        { label: "الأثر المباشر", val: "30x", sub: "مضاعفة فرص تدريب الطالب الشفهي" }
      ],
      highlights: [
        { label: "تمكين الهوية الوطنية 🇶🇦", desc: "ترسيخ الاعتزاز بالفصحى وبناء قادة قادرين على اعتلاء المنابر العالمية بثقة تامة." },
        { label: "تقنية صوتية سيادية فائقة الدقة", desc: "محرك عربي مخصص يرصد الحركات الإعرابية، التنوين، المدود، ومخارج النظائر الصوتية." },
        { label: "حوكمة مدرسية ووزارية متكاملة", desc: "لوحات بيانات حية ترصد مؤشرات الطلاقة وتولد خططاً علاجية فورية لكل مدرسة وطالب." }
      ]
    },
    {
      id: 2,
      badge: "القصة والتحدي المجتمعي | The Cultural Crisis & Story",
      badgeColor: "bg-red-950/40 border-red-500/40 text-red-300",
      title: "قصة «راشد» وأزمة الثقة باللغة العربية لدى الجيل الجديد",
      subtitle: "كيف أدت الهيمنة الرقمية للإنجليزية والبيئة المدرسية التقليدية إلى انحسار الفصاحة ورهبة التحدث؟",
      category: "problem",
      speakerNotes: "دعونا نبدأ بقصة 'راشد'، طالب في الصف السادس، متفوق وموهوب وذكي. لكن عندما يقف ليتحدث في الإذاعة المدرسية أو يعبر عن رأيه بالفصحى، يتعثر، يتلعثم، ويتحول صوته إلى همس متردد. راشد، مثل آلاف الطلاب اليوم، يقضي 6 ساعات يومياً مستهلكاً للمحتوى الرقمي باللغة الإنجليزية. اللغة الإنجليزية أصبحت لغة الراحة والتعبير لديه، بينما تحولت الفصحى إلى مادة أكاديمية جافة يشعر معها بالخوف من الخطأ في التشكيل أو سخرية الأقران. هذا الانحسار اللغوي لا يهدد تحصيله الدراسي فقط، بل يهدد هويته الوطنية وثقته القيادية.",
      storyData: {
        character: "راشد (11 عاماً) - طالب في الصف السادس",
        conflict: "ازدواجية لغوية حادة: طلاقة تامة في الإنجليزية والألعاب الرقمية، مقابل خوف ورهبة وتلعثم عند التحدث بالفصحى.",
        rootCauses: [
          { title: "الهيمنة الرقمية للإنجليزية", desc: "أكثر من 80% من المدخلات اليومية للطفل عبر اليوتيوب والألعاب باللغة الإنجليزية، مما أضعف المخزون المعجمي الفصيح." },
          { title: "عقدة 'الخوف من الخطأ النحوي'", desc: "القلق المستمر من نطق حركة إعرابية خاطئة يزرع التردد ويجعل الطالب يفضل الصمت أو الهروب للعامية." },
          { title: "انعدام بيئة التدريب الآمنة", desc: "لا يوجد مكان خاص يتدرب فيه الطالب على نبرة صوته وإلقائه دون حكم أو إحراج من الزملاء." }
        ]
      },
      highlights: [
        { label: "أزمة الثقة بالهوية العربية", desc: "تراجع استخدام الفصحى في الحوار اليومي يضعف اعتزاز النشء بلغتهم الأم." },
        { label: "فجوة التواصل والقيادة", desc: "الطلاب يملكون الأفكار لكن يعجزون عن التعبير الخطابي الرصين أمام الجمهور." },
        { label: "تحدي تربوي وطني عاجل", desc: "الحاجة إلى أداة تكنولوجية جاذبة تعيد بريق الفصحى وتجعلها تجربة ممتعة." }
      ]
    },
    {
      id: 3,
      badge: "الفجوة الميدانية بالأرقام | The Educational Bottleneck",
      badgeColor: "bg-amber-950/40 border-amber-500/40 text-amber-300",
      title: "معضلة الـ 45 دقيقة: لماذا تفشل الأساليب التقليدية؟",
      subtitle: "حسابات بسيطة تكشف استحالة تحقيق الطلاقة الشفهية بدون تقنية مساندة للمعلم",
      category: "bottleneck",
      speakerNotes: "المعلم في الفصل ليس مقصراً، لكن الرياضيات لا ترحم! في حصة مدتها 45 دقيقة تضم 25 إلى 30 طالباً، حتى لو خصص المعلم الحصة كاملة للقراءة الجهرية، فإن نصيب كل طالب لن يتجاوز 60 إلى 90 ثانية في الأسبوع بالكامل! هل يمكن لأي إنسان أن يتقن لغة أو يمتلك مهارة خطابة وتحدث بدقيقة واحدة أسبوعياً؟ الجواب قطعي: مستحيل. النتيجة: غياب المتابعة الفردية، تفويت أخطاء مخارج الحروف، وانعدام أي بيانات قياس رقمية لدى الوزارة.",
      mathComparison: {
        traditional: {
          title: "الواقع الصفي التقليدي (45 دقيقة)",
          timePerStudent: "أقل من دقيقة ونصف أسبوعياً",
          coverage: "2 إلى 4 طلاب فقط يشاركون بالحصة",
          feedback: "تغذية راجعة عامة ومقتضبة",
          data: "صفر بيانات موثقة عن التطور الصوتي"
        },
        ilqaaSolution: {
          title: "مع منظومة «إلقاء» الذكية",
          timePerStudent: "تدريب غير محدود (24/7 في المعمل أو البيت)",
          coverage: "100% من طلاب الصف يتدربون تزامناً",
          feedback: "تحليل فوري دقيق لكل كلمة وحركة ملونة",
          data: "سجل رقمي تراكمي دقيق مرتبط بمعايير الوزارة"
        }
      },
      highlights: [
        { label: "توفير 80% من جهد المعلم", desc: "تحرير المعلم من التسميع الروتيني ليركز على التوجيه الإبداعي والبلاغي." },
        { label: "تدريب متزامن لجميع الطلاب", desc: "الفصل بالكامل يقرأ ويتدرب في وقت واحد في معمل الحاسوب أو الأجهزة اللوحية." },
        { label: "بيانات تشخيصية لحظية", desc: "رصد فوري لنسبة دقة التشكيل ومعدل الكلمات في الدقيقة (WPM)." }
      ]
    },
    {
      id: 4,
      badge: "الحل المتكامل | The 3 Pillars Architecture",
      badgeColor: "bg-emerald-950/40 border-emerald-500/40 text-emerald-300",
      title: "منظومة «إلقاء»: ثلاث ركائز تقنية تصنع القائد الفصيح",
      subtitle: "تصميم رحلة تعليمية متكاملة تنقل الطالب من التأسيس الصوتي إلى القيادة المنبرية",
      category: "solution",
      speakerNotes: "الحل الذي بنيناه لا يقدم مجرد تمارين عادية، بل صممنا رحلة ثلاثية متدرجة تغطي كافة احتياجات المنهج القطري: أولاً مختبر التأسيس القرائي والصوت لضبط الحركات ومخارج الحروف، ثانياً مسرح الإلقاء والمنبر التفاعلي لكسر رهبة الجمهور وتدريب لغة الجسد، وثالثاً لوحة القياس والتحليلات الوزارية لربط كل محاولة بمصفوفة كفايات 2018 المعتمدة.",
      pillars: [
        {
          num: "01",
          name: "مختبر الصوت والقراءة الجهرية",
          tabKey: "practice",
          icon: Mic,
          tag: "Voice Practice Lab",
          desc: "محرك تعرف صوتي فائق الدقة يقارن نطق الطالب بنصوص معايير قطر (KG-12) ويكتشف أخطاء الحركات والتنوين والسرعة مع تسجيل وإعادة استماع فورية."
        },
        {
          num: "02",
          name: "مسرح الإلقاء والمنبر التفاعلي",
          tabKey: "oratory",
          icon: Video,
          tag: "Oratory Stage & HUD",
          desc: "بيئة محاكاة لمسرح وقاعة مؤتمرات كاملة مع جمهور متفاعل، وملقن ذكي (AI Prompter) يوجه نبرة الصوت وسرعة الإلقاء ولغة الجسد في الوقت الفعلي."
        },
        {
          num: "03",
          name: "مركز القياس وحوكمة المعايير",
          tabKey: "dashboard",
          icon: BarChart3,
          tag: "Ministry Analytics Hub",
          desc: "لوحة تحكم للمشرفين والوزارة ترصد مصفوفة الكفايات الست، وتصنف مستويات الإتقان (متمكن، نامٍ، متعثر) وتصدر خططاً علاجية فورية."
        }
      ],
      highlights: [
        { label: "تغطية شاملة للمهارات", desc: "نطق سليم + ضبط نحوي + حضور ذهني ومنبري + ثقة بالنفس." },
        { label: "بيئة نفسية آمنة 100%", desc: "يتدرب الطالب بمفرده وبخصوصية تامة دون خوف من الانتقاد." },
        { label: "ربط رقمي مباشر بالمناهج", desc: "كل نص وكل سؤال مسند برقم كود المعيار القطري الرسمي." }
      ]
    },
    {
      id: 5,
      badge: "القسم الأول: مختبر الصوت | Live Product Showcase",
      badgeColor: "bg-blue-950/40 border-blue-500/40 text-blue-300",
      title: "مختبر القراءة والصوت الذكي (Voice Practice Lab)",
      subtitle: "تحليل فوري لمخارج الحروف، التشكيل، والطلاقة مع الاستماع للتسجيل ومقارنته بالنموذج",
      category: "product_voice",
      speakerNotes: "في مختبر الصوت، يختار الطالب المعيار المخصص لصفه. وبمجرد ضغط زر التسجيل، يقوم المحرك برصد الصوت كلمة بكلمة: الكلمات الصحيحة تتلون بالأخضر، والأخطاء بالأحمر. يحصل الطالب على درجة دقة فورية، ومعدل سرعة WPM، ويمكنه الاستماع لتسجيله الصوتي ومقارنته بنطق القارئ النموذجي المتقن. كما وفرنا خاصية تصفير المحاولات والتحديات التنافسية الذكية.",
      uiFeatureHighlights: [
        { title: "تلوين الكلمات اللحظي", desc: "تمييز بصري فوري للكلمات المنطوقة بدقة مع كشف أخطاء الحركات والهمزات." },
        { title: "الاستماع للتسجيل والنموذج", desc: "إمكانية استماع الطالب لصوته الخاص ومقارنته فورياً مع نطق القارئ النموذجي الفصيح." },
        { title: "تصفير المحاولات ووضع العرض", desc: "أزرار تحكم مرنة تتيح إعادة المحاولة واختبار كافة المعايير الوطنية بمرونة تامة." },
        { title: "مؤشرات السرعة والطلاقة", desc: "قياس الـ WPM وزمن الاستجابة (Latency < 70ms) لضمان انسيابية الحديث." }
      ],
      navTarget: "practice",
      highlights: [
        { label: "مخارج النظائر الصوتية", desc: "تمييز دقيق بين الحروف المتقاربة مثل (س/ص، ت/ط، ذ/ظ)." },
        { label: "ضبط أواخر الكلم", desc: "فحص الحركات الإعرابية (الرفع، النصب، الجر، الجزم)." },
        { label: "توليد نصوص ذكية", desc: "إمكانية توليد عبارات تدريبية إضافية عبر الذكاء الاصطناعي تناسب مستوى الطالب." }
      ]
    },
    {
      id: 6,
      badge: "القسم الثاني: مسرح الإلقاء | Live Product Showcase",
      badgeColor: "bg-fuchsia-950/40 border-fuchsia-500/40 text-fuchsia-300",
      title: "منصة الإلقاء والمنبر التفاعلي (Oratory Stage)",
      subtitle: "صناعة الخطيب الواثق عبر محاكاة واقعية للمنبر مع تفاعل الجمهور وملقن ذكي لحظي",
      category: "product_oratory",
      speakerNotes: "هنا ننتقل من مرحلة القراءة إلى مرحلة القيادة والخطابة! في منصة الإلقاء، يقف الطالب أمام كاميرا ذكية تحاكي وجوده في قاعة احتفالات أو مؤتمر وطني. الجمهور الافتراضي يتفاعل تصفيقاً أو هدوءاً بحسب جودة الإلقاء، والملقن الذكي (AI Prompter) يوجهه بالسرعة المناسبة ولغة الجسد والنبرة الملائمة للخطبة. كما يتم تفريغ كلامه لنص مباشر وتخزين تسجيله للتقييم والمراجعة.",
      uiFeatureHighlights: [
        { title: "محاكاة المسرح والجمهور الحقيقي", desc: "مؤثرات بصرية وصوتية تفاعلية تعود الطالب على مواجهة الجماهير وكسر رهبة المنصة." },
        { title: "الملقن الذكي (AI Prompter)", desc: "إرشادات لحظية على الشاشة توجه الطالب متى يرفع نبرته، ومتى يتأنى، وكيف يوزع نظراته." },
        { title: "تحويل الكلام إلى نص مباشر (STT)", desc: "تفريغ فوري لكلمات الخطيب مع إمكانية مسح النص أو استدعاء نصوص نموذجية للتمرن." },
        { title: "مؤشرات الأداء المنبري (HUD)", desc: "عداد للثواني، نسبة التواصل البصري، درجة الحماس، ونقاء الصوت دون حشو." }
      ],
      navTarget: "oratory",
      highlights: [
        { label: "كسر حاجز الخوف والرهاب", desc: "التدريب التكراري في بيئة المحاكاة يزيل قلق التحدث أمام الجمهور بنسبة تفوق 70%." },
        { label: "تطوير الكاريزما القيادية", desc: "تدريب على الإيماءات، الوقفات المؤثرة، وتنويع النبرة الصوتية بين الحماس والإقناع." },
        { label: "جاهزية للاحتفالات والمناظرات", desc: "إعداد خطباء متميزين لتمثيل مدارسهم في المناظرات والمسابقات الوطنية." }
      ]
    },
    {
      id: 7,
      badge: "القسم الثالث: التحليلات والحوكمة | Ministry Governance",
      badgeColor: "bg-purple-950/40 border-purple-500/40 text-purple-300",
      title: "لوحة تحكم الوزارة ومصفوفة المعايير (Standards Hub)",
      subtitle: "حوكمة رقمية شاملة تربط كل تسجيل بكفايات المنهج القطري وتولد خططاً علاجية فورية",
      category: "product_dashboard",
      speakerNotes: "بالنسبة لقيادات الوزارة والموجهين والمعلمين، توفر المنصة لأول مرة لوحة قياس مركزية موثوقة. لم يعد التقييم الشفهي انطباعياً أو عشوائياً، بل أصبح رقمياً دقيقاً. يمكن للموجه معرفة نسبة الإتقان في كل مدرسة، وتحديد المعايير التي تحتاج تدخلاً علاجياً، وتوليد تقارير أكاديمية جاهزة للطباعة والتصدير لكل طالب وولي أمر.",
      uiFeatureHighlights: [
        { title: "مصفوفة الكفايات الست 2018", desc: "تتبع مباشر لكل كفاية: الوعي الصوتي، القراءة الجهرية، السلامة النحوية، والخطابة." },
        { title: "مؤشرات التمكن والعلاج", desc: "تصنيف الطلاب تلقائياً إلى: متمكن (85% فأكثر)، في طور النمو، أو بحاجة لتدخل علاجي." },
        { title: "تقارير تشخيصية قابلة للتصدير", desc: "بطاقة أداء رسمية موثقة تبرز نقاط القوة وفرص التحسين وتوصيات التدريب المنزلي." },
        { title: "زر التصفير وإعادة الضبط الشامل", desc: "تحكم كامل في تصفير بيانات الطلاب أو إعادة ضبط المنصة لبدء فترات تقويمية جديدة." }
      ],
      navTarget: "dashboard",
      highlights: [
        { label: "قرارات تعليمية مدفوعة بالبيانات", desc: "توجيه الموارد التعليمية والتدريبية للمدارس الأكثر احتياجاً بدقة متناهية." },
        { label: "متابعة تراكمية لنمو الطالب", desc: "ملف إنجاز صوتي رقمي يرافق الطالب عبر مختلف المراحل الدراسية." },
        { label: "تكامل سلس مع الأنظمة المدرسية", desc: "جاهزية للربط مع نظام إدارة التعلم المعتمد في الوزارة (LMS)." }
      ]
    },
    {
      id: 8,
      badge: "خطة التطبيق التجريبي | 8-Week Pilot Framework",
      badgeColor: "bg-indigo-950/40 border-indigo-500/40 text-indigo-300",
      title: "خارطة طريق المشروع التجريبي المشترك (Pilot Validation)",
      subtitle: "تطبيق تجريبي محكم في 10 مدارس لقياس الأثر وتحقيق أعلى عائد تعليمي قبل التعميم",
      category: "roadmap",
      speakerNotes: "نقترح خطة تنفيذ تجريبية محكمة تمتد على 8 أسابيع في 10 مدارس حكومية ودولية مختارة. تشمل الخطة: مرحلة الإعداد وتدريب المنسقين، تليها 4 أسابيع من الاستخدام الصفي والمنزلي المكثف، ثم مرحلة القياس القبلي والبعدي وإصدار التقرير الختامي لاعتماد الشراكة الوطنية الشاملة.",
      timelineSteps: [
        {
          weeks: "الأسبوع 1 - 2",
          phase: "التهيئة والتدريب",
          desc: "اختيار 10 مدارس (ابتدائي وإعدادي)، وتدريب 40 منسقاً ومعلماً على النظام وإنشاء حسابات الطلاب."
        },
        {
          weeks: "الأسبوع 3 - 6",
          phase: "التطبيق الميداني النشط",
          desc: "ممارسة أسبوعية منتظمة (جلستان بالمعمل + جلسة منزلية)، مع إطلاق تحديات أسبوعية ومتابعة حية من الموجهين."
        },
        {
          weeks: "الأسبوع 7 - 8",
          phase: "القياس، التقييم والاعتماد",
          desc: "إجراء اختبار قياس بعدي مقارن، وتوثيق نسب التحسن في الطلاقة والضبط النحوي، وتقديم التقرير النهائي للوزارة."
        }
      ],
      highlights: [
        { label: "عينة تطبيق متوازنة", desc: "1,500 طالب من مختلف الصفوف والمستويات لضمان دقة النتائج." },
        { label: "دعم فني وتدريبي على مدار الساعة", desc: "فريق مخصص لمساندة المعلمين وحل أي استفسارات تقنية فوراً." },
        { label: "مؤشرات نجاح واضحة ومسبقة", desc: "قياس دقيق لنسبة تحسن النطق وسرعة القراءة ورضا المعلمين والطلبة." }
      ]
    },
    {
      id: 9,
      badge: "مؤشرات العائد والأثر | ROI & Impact Metrics",
      badgeColor: "bg-teal-950/40 border-teal-500/40 text-teal-300",
      title: "الأثر المتوقع والعائد الاستثماري على المنظومة التعليمية",
      subtitle: "مخرجات نوعية تسهم في رفع ترتيب الدولة في الاختبارات الدولية وتحقيق رؤية قطر 2030",
      category: "impact",
      speakerNotes: "العائد من هذا الاستثمار ليس مالياً فحسب، بل هو عائد استراتيجي وطني: نتوقع ارتفاع دقة الضبط والنطق بنسبة 30% خلال فصل واحد، توفير 80% من وقت الرصد الشفوي للمعلم، والمساهمة المباشرة في رفع نتائج الاختبارات الدولية والوطنية، وخلق جيل فخور بلغته العربية قادر على تمثيل قطر في المحافل العالمية.",
      impactGrid: [
        { metric: "+35%", title: "تحسن في دقة التشكيل ومخارج الحروف", desc: "بفضل التغذية الراجعة الصوتية الفورية والمقارنة مع القارئ النموذجي." },
        { metric: "80%", title: "توفير في وقت رصد المعلم الشفهي", desc: "استبدال التسميع اليدوي المرهق بتقارير آلية متزامنة عالية الدقة." },
        { metric: "3x", title: "مضاعفة معدل القراءة الجهرية (WPM)", desc: "تحول الطالب من التردد والتهجئة البطيئة إلى الانسيابية والطلاقة." },
        { metric: "100%", title: "استعادة الثقة والاعتزاز بالفصحى", desc: "كسر رهبة التحدث وتحويل القراءة إلى تجربة تفاعلية مليئة بالمكافآت." }
      ],
      highlights: [
        { label: "دعم اختبارات PIRLS و PISA", desc: "رفع مهارات الفهم القرائي والسرعة الذهنية يعزز نتائج الدولة في المقارنات الدولية." },
        { label: "بيئة خالية من التكلفة الرأسمالية", desc: "تطبيق ويب يعمل على أي جهاز موجود مسبقاً في المدرسة دون الحاجة لأجهزة إضافية." },
        { label: "صناعة مواهب خطابة للمسابقات", desc: "اكتشاف وتأهيل الطلاب الموهوبين مبكراً للمسابقات الخطابية والشعرية." }
      ]
    },
    {
      id: 10,
      badge: "طلب الاستثمار والشراكة | The Investment Ask & Call to Action",
      badgeColor: "bg-gradient-to-r from-[#8A1538] to-purple-900 border-[#D4AF37] text-white",
      title: "ما نطلبه اليوم: شراكة استراتيجية نحو تمكين جيل الغد",
      subtitle: "دعوة لتبني المشروع الرائد ومنح الموافقة المبدئية للبدء في المدارس المستهدفة",
      category: "the_ask",
      speakerNotes: "أصحاب السعادة والقرار، نطلب اليوم من حضرتكم خطوتين أساسيتين: أولاً، الموافقة المبدئية واعتماد المشروع التجريبي المشترك في الـ 10 مدارس المختارة للفصل الدراسي الحالي. ثانياً، الشراكة الاستراتيجية والتسهيلات اللازمة لربط المنصة وتدريب المنسقين. نحن جاهزون تماماً للبدء الفوري، والمنصة بين أيديكم الآن للتجربة الحية. معاً نصنع الجيل الأكثر فصاحة وثقة في تاريخ قطر.",
      askCards: [
        {
          step: "01",
          title: "الموافقة المبدئية (Endorsement)",
          desc: "اعتماد منصة «إلقاء» كمنظومة ذكاء اصطناعي صوتية مرخصة في المشروع التجريبي المشترك."
        },
        {
          step: "02",
          title: "تسمية المدارس التجريبية (10 Schools)",
          desc: "تحديد قائمة المدارس وتسمية ضابط اتصال من توجيه اللغة العربية للإشراف على تطبيق التجربة."
        },
        {
          step: "03",
          title: "الاستثمار وتوسيع البنية التحتية",
          desc: "دعم التوسع السحابي وتكامل الواجهات البرمجية وتوسيع بنك النصوص لجميع صفوف المنهج."
        }
      ],
      highlights: [
        { label: "جاهزية فورية للإطلاق", desc: "المنصة مكتملة البناء وتعمل بكفاءة تامة على كافة متصفحات الويب والأجهزة اللوحية." },
        { label: "تجربة حية الآن", desc: "ندعو السادة أعضاء اللجنة لتجربة الميكروفون ومسرح الإلقاء مباشرة." },
        { label: "فريق وطني وتقني متكامل", desc: "خبرة هندسية وبيداغوجية تجمع بين الذكاء الاصطناعي وخبرات تدريس اللغة العربية." }
      ]
    }
  ];

  const currentSlideData = slides[currentSlide];

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(currentSlideData.speakerNotes);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  // Download full standalone HTML presentation file
  const handleDownloadHtml = () => {
    const htmlContent = generatePresentationHtml(slides as any, isRtl);
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "عرض_وزارة_التربية_والتعليم_منصة_إلقاء_قطر_2026.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open clean printable version in new window to print or save directly as PDF
  const handlePrintPdf = () => {
    const htmlContent = generatePresentationHtml(slides as any, isRtl);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 600);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto" dir={isRtl ? "rtl" : "ltr"} id="ministry-pitch-modal">
      <div className={`w-full max-w-5xl bg-[#120308] border border-[#D4AF37]/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white transition-all ${isFullscreen ? "h-[97vh]" : "max-h-[92vh]"}`}>
        
        {/* Top Header Bar with Qatari Maroon & Gold Accent */}
        <div className="px-6 py-3.5 border-b border-[#8A1538]/60 flex items-center justify-between bg-gradient-to-r from-[#2A0510] via-[#46081B] to-[#120308]">
          <div className="flex items-center gap-3">
            <IlqaaLogo size="sm" />
            <div className="hidden sm:block">
              <span className="text-xs font-black text-amber-200 block leading-tight tracking-wide">
                {isRtl ? "ملف العرض الاستثماري والموافقة المبدئية — وزارة التربية والتعليم والتعليم العالي 🇶🇦" : "MoEHE Qatar Investment & Executive Pitch Deck 🇶🇦"}
              </span>
              <span className="text-[10px] text-[#D4AF37] font-mono font-semibold">
                {isRtl ? "منظومة «إلقاء» للذكاء الاصطناعي اللغوي والمنبري (Qatar AI Oratory System)" : "Qatar AI Oratory & Literacy Ecosystem"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Presentation File Button */}
            <button
              onClick={handleDownloadHtml}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-600 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              title="تحميل ملف العرض التقديمي التفاعلي بصيغة HTML على اللابتوب"
              id="download-presentation-btn"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRtl ? "تحميل العرض (HTML) 📥" : "Download Deck"}</span>
            </button>

            {/* Print / Save PDF Button */}
            <button
              onClick={handlePrintPdf}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#8A1538]/70 hover:bg-[#8A1538] text-white border border-[#D4AF37]/50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="طباعة العرض أو حفظه كملف PDF للابتوب"
              id="print-pdf-presentation-btn"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">{isRtl ? "حفظ كـ PDF 🖨️" : "Save as PDF"}</span>
            </button>

            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-black/50 border border-[#D4AF37]/40 text-[#FDE68A] shadow-inner">
              {currentSlide + 1} / {slides.length}
            </span>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer hidden sm:flex border border-slate-700/50"
              title={isFullscreen ? "تصغير الشاشة" : "ملء الشاشة"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all cursor-pointer"
              title="إغلاق العرض"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
          
          {/* Header Badge, Title, and Subtitle */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-black px-3 py-1 rounded-full border uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm ${currentSlideData.badgeColor}`}>
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span>{currentSlideData.badge}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Slide {currentSlide + 1} of {slides.length}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-tight leading-snug">
              {currentSlideData.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-3xl leading-relaxed">
              {currentSlideData.subtitle}
            </p>
          </div>

          {/* DYNAMIC CONTENT PER SLIDE TYPE */}

          {/* Slide 1: KPIs & Intro */}
          {currentSlideData.category === "overview" && currentSlideData.kpis && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentSlideData.kpis.map((kpi, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#2A0512]/60 border border-[#8A1538]/50 text-center space-y-1">
                  <p className="text-[11px] font-bold text-amber-300">{kpi.label}</p>
                  <p className="text-2xl sm:text-3xl font-black font-mono text-white">{kpi.val}</p>
                  <p className="text-[10px] text-slate-400">{kpi.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Slide 2: The Rashid Story Box */}
          {currentSlideData.category === "problem" && currentSlideData.storyData && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-950/30 via-slate-900/90 to-red-950/20 border border-red-500/30 space-y-4">
              <div className="flex items-center gap-2 text-red-300 font-bold text-xs pb-2 border-b border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>شخصية القصة: {currentSlideData.storyData.character}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-serif bg-black/40 p-3 rounded-xl border border-red-500/20">
                "{currentSlideData.storyData.conflict}"
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {currentSlideData.storyData.rootCauses.map((cause, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-red-500/20 space-y-1">
                    <h5 className="font-bold text-xs text-amber-200 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{cause.title}</span>
                    </h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{cause.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slide 3: Math Comparison (Traditional vs Ilqaa) */}
          {currentSlideData.category === "bottleneck" && currentSlideData.mathComparison && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-red-500/30 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs pb-2 border-b border-red-500/20">
                  <Clock className="w-4 h-4" />
                  <span>{currentSlideData.mathComparison.traditional.title}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 flex justify-between items-center">
                    <span className="text-slate-400">وقت التدريب لكل طالب:</span>
                    <span className="font-bold text-red-300">{currentSlideData.mathComparison.traditional.timePerStudent}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 flex justify-between items-center">
                    <span className="text-slate-400">نسبة مشاركة الفصل:</span>
                    <span className="font-bold text-red-300">{currentSlideData.mathComparison.traditional.coverage}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 flex justify-between items-center">
                    <span className="text-slate-400">بيانات القياس التراكمية:</span>
                    <span className="font-bold text-red-300">{currentSlideData.mathComparison.traditional.data}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-emerald-950/20 border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs pb-2 border-b border-emerald-500/20">
                  <Zap className="w-4 h-4" />
                  <span>{currentSlideData.mathComparison.ilqaaSolution.title}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex justify-between items-center">
                    <span className="text-slate-300">وقت التدريب لكل طالب:</span>
                    <span className="font-bold text-emerald-300">{currentSlideData.mathComparison.ilqaaSolution.timePerStudent}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex justify-between items-center">
                    <span className="text-slate-300">نسبة مشاركة الفصل:</span>
                    <span className="font-bold text-emerald-300">{currentSlideData.mathComparison.ilqaaSolution.coverage}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex justify-between items-center">
                    <span className="text-slate-300">بيانات القياس التراكمية:</span>
                    <span className="font-bold text-emerald-300">{currentSlideData.mathComparison.ilqaaSolution.data}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Slide 4: 3 Pillars Cards */}
          {currentSlideData.category === "solution" && currentSlideData.pillars && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {currentSlideData.pillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div 
                    key={idx} 
                    className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 hover:border-purple-400 transition-all space-y-2.5 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-xs font-black text-amber-300 px-2 py-0.5 rounded-md bg-black/40 border border-amber-400/20">
                        {pillar.num}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white font-serif">{pillar.name}</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{pillar.desc}</p>
                    {onNavigateToTab && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToTab(pillar.tabKey as any);
                        }}
                        className="w-full py-1.5 px-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-[10.5px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-purple-500/30 mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>معاينة القسم في المنصة ↗</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Slide 5, 6, 7: Live Product Deep Dives with Visual Mockup Preview */}
          {(currentSlideData.category === "product_voice" || currentSlideData.category === "product_oratory" || currentSlideData.category === "product_dashboard") && currentSlideData.uiFeatureHighlights && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentSlideData.uiFeatureHighlights.map((feat, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-[#D4AF37]/50 transition-all space-y-1">
                    <h5 className="font-bold text-xs text-amber-300 font-serif flex items-center gap-1.5">
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat.title}</span>
                    </h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Direct Live Jump Button */}
              {onNavigateToTab && currentSlideData.navTarget && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/50 via-[#2A0512]/60 to-purple-950/50 border border-amber-400/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-amber-200 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>جاهز للتجربة الحية التفاعلية أمام اللجنة؟</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTab(currentSlideData.navTarget as any);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[#8A1538] hover:bg-[#A31C44] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer border border-[#D4AF37]/50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>افتح هذا القسم الآن مباشرة 🚀</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Slide 8: Timeline Roadmap */}
          {currentSlideData.category === "roadmap" && currentSlideData.timelineSteps && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentSlideData.timelineSteps.map((step, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-2 relative">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-300 inline-block">
                    {step.weeks}
                  </span>
                  <h4 className="font-bold text-sm text-white font-serif">{step.phase}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Slide 9: Impact Grid */}
          {currentSlideData.category === "impact" && currentSlideData.impactGrid && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentSlideData.impactGrid.map((imp, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/90 border border-teal-500/30 flex items-start gap-3">
                  <span className="text-2xl font-black font-mono text-teal-300 shrink-0">{imp.metric}</span>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs text-white">{imp.title}</h5>
                    <p className="text-[11px] text-slate-400">{imp.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Slide 10: The Ask Cards & Download Deck Box */}
          {currentSlideData.category === "the_ask" && currentSlideData.askCards && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {currentSlideData.askCards.map((ask, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-gradient-to-br from-[#3D0A1B] to-slate-900 border border-[#D4AF37]/50 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 text-[#FDE68A] flex items-center justify-center font-bold text-xs font-mono">
                      {ask.step}
                    </div>
                    <h4 className="font-bold text-xs text-white font-serif">{ask.title}</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{ask.desc}</p>
                  </div>
                ))}
              </div>

              {/* Direct Download Box for Laptop */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2A0512] via-[#46081B] to-[#120308] border-2 border-[#D4AF37] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
                <div className="space-y-1 text-center sm:text-start">
                  <div className="text-xs font-black text-[#FDE68A] flex items-center justify-center sm:justify-start gap-1.5">
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>تحميل نسخة العرض الكاملة على جهاز اللابتوب للمراجعة والتقديم (Offline Ready)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    يمكنك تنزيل ملف العرض كملف تفاعلي مستقل يعمل بدون إنترنت أو حفظه كملف PDF عالي الدقة.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadHtml}
                    className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    title="تحميل كملف HTML مستقل"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل كـ HTML 📥</span>
                  </button>
                  <button
                    onClick={handlePrintPdf}
                    className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-[#D4AF37]/60 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="حفظ أو طباعة كملف PDF"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>حفظ PDF 🖨️</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Three Key Highlights Bullet Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {currentSlideData.highlights.map((hl, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <h5 className="font-bold text-xs text-cyan-300 font-serif flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{hl.label}</span>
                </h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {hl.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Speaker Notes Box (ماذا تقول لأصحاب القرار والمستثمرين) */}
          <div className="p-4 rounded-2xl bg-purple-950/25 border border-purple-800/40 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fuchsia-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isRtl ? "ملاحظات وتوجيهات المتحدث للجنة الوزارة والمستثمرين (Speaker Talking Points):" : "Speaker Notes & Pitch Script:"}</span>
              </span>

              <button
                onClick={handleCopyNotes}
                className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-800/70 px-2.5 py-1 rounded-lg transition-all border border-slate-700/50"
              >
                {copiedNote ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNote ? (isRtl ? "تم النسخ" : "Copied") : (isRtl ? "نسخ نص السرد" : "Copy Script")}</span>
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-serif bg-black/30 p-3 rounded-xl border border-purple-900/30">
              "{currentSlideData.speakerNotes}"
            </p>
          </div>
        </div>

        {/* Bottom Slide Navigation Bar */}
        <div className="px-6 py-3.5 border-t border-slate-800/90 flex items-center justify-between bg-slate-950/90">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSlide === 0 ? "opacity-30 border-slate-800 text-slate-500 cursor-not-allowed" : "border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
            }`}
          >
            <ChevronRight className={`w-4 h-4 ${!isRtl ? "rotate-180" : ""}`} />
            <span>{isRtl ? "الشريحة السابقة" : "Previous"}</span>
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? "w-6 bg-gradient-to-r from-[#D4AF37] to-[#8A1538]" : "w-2 bg-slate-700 hover:bg-slate-600"
                }`}
                title={`الشريحة ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSlide === slides.length - 1 ? "opacity-30 border-slate-800 text-slate-500 cursor-not-allowed" : "border-[#D4AF37]/50 bg-[#8A1538] text-white hover:bg-[#A31C44]"
            }`}
          >
            <span>{isRtl ? "الشريحة التالية" : "Next"}</span>
            <ChevronLeft className={`w-4 h-4 ${!isRtl ? "rotate-180" : ""}`} />
          </button>
        </div>

      </div>
    </div>
  );
}

