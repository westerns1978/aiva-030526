import React from 'react';
import { 
  Home, 
  Menu, 
  X, 
  Search, 
  Plus, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Bell,
  Send,
  Plane,
  Copy,
  Download,
  Share2,
  RefreshCcw,
  Mic,
  Keyboard,
  Camera,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Maximize2,
  Minimize2,
  Users,
  UserCheck,
  Briefcase,
  IdCard,
  FileText,
  ClipboardList,
  FileCheck,
  FilePlus,
  FileDown,
  Paperclip,
  ShieldCheck,
  Lock,
  BookOpen,
  GraduationCap,
  BarChart,
  TrendingUp,
  Star,
  Zap,
  Cloud,
  Wrench,
  Smartphone,
  Eye,
  EyeOff,
  Smile,
  MessageCircle,
  MessageSquare,
  Phone,
  Mail,
  Sparkles,
  MapPin,
  Map,
  Clock,
  Building,
  QrCode,
  Sun,
  Moon,
  Library,
  Heart,
  HelpCircle,
  Monitor
} from 'lucide-react';

const aivaImageUrl = 'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/ai-aiva2.png';
const afridroidsLogoUrl = 'https://storage.googleapis.com/gemynd-public/projects/aiva/AfriDroids2%20(1).png';

export const AivaLogo: React.FC<React.ComponentProps<'img'>> = ({ className, ...props }) => (
    <img 
        src={afridroidsLogoUrl} 
        alt="AfriDroids Robotics" 
        className={`object-contain select-none pointer-events-none transition-all duration-300 ${className}`} 
        {...props} 
    />
);

export const AivaAvatar: React.FC = () => (
    <div className="w-10 h-10 rounded-full bg-brand-dark flex items-center justify-center ring-4 ring-white overflow-hidden shrink-0">
        <img src={aivaImageUrl} alt="Aiva" className="w-full h-full object-cover" />
    </div>
);

// Unified Lucide Icon Mappings
export const HomeIcon = Home;
export const MenuIcon = Menu;
export const CloseIcon = X;
export const MagnifyingGlassIcon = Search;
export const PlusIcon = Plus;
export const ArrowRightIcon = ArrowRight;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRightIcon = ChevronRight;
export const CheckCircleIcon = CheckCircle;
export const ExclamationTriangleIcon = AlertTriangle;
export const InformationCircleIcon = Info;
export const BellIcon = Bell;
export const SendIcon = Send;
export const PaperAirplaneIcon = Plane;
export const CopyIcon = Copy;
export const DownloadIcon = Download;
export const ShareIcon = Share2;
export const RefreshIcon = RefreshCcw;
export const MicrophoneIcon = Mic;
export const KeyboardIcon = Keyboard;
export const PhotoIcon = Camera;
export const SpeakerWaveIcon = Volume2;
export const SpeakerXMarkIcon = VolumeX;
export const PlayIcon = Play;
export const PauseIcon = Pause;
export const StopIcon = Square;
export const StopCircle = Square;
export const MaximizeIcon = Maximize2;
export const MinimizeIcon = Minimize2;
export const UsersIcon = Users;
export const UserGroupIcon = Users;
export const UserCheckIcon = UserCheck;
export const BriefcaseIcon = Briefcase;
export const IdentificationIcon = IdCard;
export const IdCardIcon = IdCard;
export const DocumentTextIcon = FileText;
export const ClipboardDocumentListIcon = ClipboardList;
export const ClipboardDocumentCheckIcon = FileCheck;
export const DocumentPlusIcon = FilePlus;
export const DocumentArrowDownIcon = FileDown;
export const PaperclipIcon = Paperclip;
export const ShieldCheckIcon = ShieldCheck;
export const LockClosedIcon = Lock;
export const BookOpenIcon = BookOpen;
export const GraduationCapIcon = GraduationCap;
export const AcademicCapIcon = GraduationCap;
export const ChartBarIcon = BarChart;
export const TrendingUpIcon = TrendingUp;
export const StarIcon = Star;
export const AiSparkIcon = Sparkles;
export const CloudIcon = Cloud;
export const WrenchScrewdriverIcon = Wrench;
export const DevicePhoneMobileIcon = Smartphone;
export const EyeIcon = Eye;
export const EyeSlashIcon = EyeOff;
export const FaceSmileIcon = Smile;
export const ChatBubbleLeftRightIcon = MessageSquare;
export const ChatBubbleBottomCenterTextIcon = MessageCircle;
export const WhatsAppIcon = Phone;
export const PhoneIcon = Phone;
export const MailIcon = Mail;
export const SparklesIcon = Sparkles;
export const MapPinIcon = MapPin;
export const MapIcon = Map;
export const ClockIcon = Clock;
export const BuildingOfficeIcon = Building;
export const QrCodeIcon = QrCode;
export const SunIcon = Sun;
export const MoonIcon = Moon;
export const BuildingLibraryIcon = Library;
export const HeartPulseIcon = Heart;
export const GlobeAltIcon = Monitor;
export const LifebuoyIcon = HelpCircle;
export const MegaphoneIcon = Bell;
export const VideoCameraIcon = Camera;
export const HeartIcon = Heart;
export const QuestionMarkCircleIcon = HelpCircle;
export const ComputerDesktopIcon = Monitor;
export const DirectoryUsersIcon = Users;
export const PencilSquareIcon = FileText;
export const BanknoteIcon = FileText;
export const CurrencyDollarIcon = FileText;
export const DocumentChartBarIcon = BarChart;
export const UserArrowInIcon = UserCheck;
export const UserArrowOutIcon = Users;

const Coffee = (props: any) => <Monitor {...props} />;
export const CoffeeToGoIcon = Coffee;
export const CoffeeIcon = Coffee;
export const CalendarOffIcon = Clock;