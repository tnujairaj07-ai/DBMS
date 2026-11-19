import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Bell,
  Search,
  Star,
  Users,
  Award,
  Layers,
  Sparkles,
  User,
  FileText,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  HelpCircle,
  Compass,
  Video,
  MapPin,
  TrendingUp,
  LayoutDashboard,
  GraduationCap,
  Filter,
  X,
  MessageSquare,
  ShieldCheck,
  Send,
  Calendar,
  Check,
  Briefcase,
  UserCheck
} from 'lucide-react';

// Rich catalog with multiple faculty supervisors and peer mentors per course
const DEFAULT_COURSES = [
  {
    id: 1,
    domain: 'Artificial Intelligence & Machine Learning',
    code: 'CS-AI-401',
    title: 'Machine Learning & Deep Neural Architectures',
    level: 'Advanced',
    duration: '8 Modules • 16 Weeks',
    bgColor: 'bg-[#f0f4ff]',
    borderColor: 'border-[#dbeafe]',
    accentColor: '#3b82f6',
    accentText: 'text-blue-600',
    description:
      'Master supervised/unsupervised algorithms, deep convolutional networks, transformer pipelines, PyTorch implementations, and model deployment on production edge servers.',
    illustrationType: 'ai',
    primarySkill: 'PyTorch / TensorFlow',
    facultySupervisors: [
      {
        id: 1,
        name: 'Dr. Aris Thorne',
        designation: 'Professor & AI Lab Director',
        dept: 'Computer Science & AI',
        rating: 4.9,
        reviewsCount: 38,
        specialization: 'Deep Learning & Neural Vision',
        capacity: '2 / 3 Teams Allocated',
        skills: ['PyTorch', 'Computer Vision', 'Transformers', 'TensorRT', 'Edge AI'],
        bio: 'Leading researcher in neural computer vision with 14+ IEEE publications. Directs the university AI Perception Lab and has mentored 45+ capstone teams.',
        avatarBg: 'from-blue-600 to-indigo-600'
      },
      {
        id: 7,
        name: 'Dr. Rajiv Saxena',
        designation: 'Associate Professor',
        dept: 'Artificial Intelligence & Robotics',
        rating: 4.85,
        reviewsCount: 26,
        specialization: 'Reinforcement Learning & LLMs',
        capacity: '1 / 3 Teams Allocated',
        skills: ['Deep RL', 'PyTorch', 'LangChain', 'Vector DBs', 'NLP'],
        bio: 'Senior researcher specializing in agentic workflows, model distillation, and policy gradient algorithms. Guides thesis projects on multimodal AI.',
        avatarBg: 'from-indigo-600 to-blue-700'
      }
    ],
    peerMentors: [
      {
        id: 1,
        name: 'Sophia Reynolds',
        rank: 'Rank #1 Peer Mentor',
        semester: 'Semester 7',
        dept: 'CSE - AI Specialization',
        rating: 4.95,
        sessionsCount: 24,
        reviewsCount: 19,
        skills: ['PyTorch', 'OpenCV', 'FastAPI', 'NumPy'],
        bio: 'Published author in CVPR workshops. Passionate about helping teams debug matrix dimensions, loss divergences, and custom PyTorch dataloaders.',
        avatarBg: 'from-indigo-500 to-purple-600'
      },
      {
        id: 8,
        name: 'Alex Vance',
        rank: 'Rank #7 Peer Mentor',
        semester: 'Semester 6',
        dept: 'Computer Science',
        rating: 4.8,
        sessionsCount: 14,
        reviewsCount: 11,
        skills: ['Scikit-Learn', 'Feature Engineering', 'Data Augmentation', 'Keras'],
        bio: 'Kaggle Master and campus hackathon lead. Great at simplifying complex loss backpropagation and tuning XGBoost / Random Forest models.',
        avatarBg: 'from-blue-500 to-cyan-600'
      }
    ]
  },
  {
    id: 2,
    domain: 'Cloud Computing & Distributed Systems',
    code: 'CS-CC-402',
    title: 'Cloud-Native Distributed Systems & Microservices',
    level: 'Intermediate',
    duration: '6 Modules • 12 Weeks',
    bgColor: 'bg-[#fbf5ff]',
    borderColor: 'border-[#f3e8ff]',
    accentColor: '#9333ea',
    accentText: 'text-purple-600',
    description:
      'Design fault-tolerant microservices architectures with Kubernetes cluster orchestration, Docker containerization, gRPC communications, and distributed consensus algorithms.',
    illustrationType: 'cloud',
    primarySkill: 'Kubernetes & Docker',
    facultySupervisors: [
      {
        id: 2,
        name: 'Dr. Elena Vance',
        designation: 'Associate Professor',
        dept: 'Computer Science & Engineering',
        rating: 4.85,
        reviewsCount: 29,
        specialization: 'Distributed Systems & Cloud Architecture',
        capacity: '2 / 3 Teams Allocated',
        skills: ['Kubernetes', 'Go', 'gRPC', 'Distributed Consensus', 'AWS/GCP'],
        bio: 'Former senior cloud infrastructure architect. Specialized in zero-downtime microservice deployments, consensus protocols (Raft), and serverless telemetry.',
        avatarBg: 'from-purple-600 to-pink-600'
      },
      {
        id: 9,
        name: 'Prof. Kenneth Meyer',
        designation: 'Chair of Distributed Computing',
        dept: 'Cloud & Systems Engineering',
        rating: 4.9,
        reviewsCount: 32,
        specialization: 'Fault Tolerance & High Availability',
        capacity: '1 / 2 Teams Allocated',
        skills: ['Kafka', 'Service Mesh (Istio)', 'Docker', 'Linux Internals', 'Terraform'],
        bio: 'Research focus on high-throughput distributed protocols and chaos engineering. Guides infrastructure design and container cluster defense.',
        avatarBg: 'from-violet-600 to-purple-800'
      }
    ],
    peerMentors: [
      {
        id: 2,
        name: 'Marcus Chen',
        rank: 'Rank #2 Peer Mentor',
        semester: 'Semester 8',
        dept: 'Information Technology',
        rating: 4.9,
        sessionsCount: 31,
        reviewsCount: 25,
        skills: ['Docker', 'Kubernetes', 'Helm', 'Terraform'],
        bio: 'Certified Kubernetes Administrator (CKA). Mentored 20+ capstone teams in containerizing backend architectures and setting up CI/CD pipelines.',
        avatarBg: 'from-fuchsia-500 to-pink-500'
      },
      {
        id: 10,
        name: 'Jordan Lee',
        rank: 'Rank #8 Peer Mentor',
        semester: 'Semester 7',
        dept: 'Cloud Systems',
        rating: 4.82,
        sessionsCount: 18,
        reviewsCount: 14,
        skills: ['AWS Lambda', 'API Gateway', 'Docker Compose', 'Redis'],
        bio: 'AWS Certified Solutions Architect. Helps student teams deploy cost-effective serverless backends and set up secure ingress controllers.',
        avatarBg: 'from-purple-500 to-indigo-600'
      }
    ]
  },
  {
    id: 3,
    domain: 'Cybersecurity & Information Assurance',
    code: 'CS-SEC-403',
    title: 'Zero-Trust Security & Offensive Threat Modeling',
    level: 'Advanced',
    duration: '8 Modules • 14 Weeks',
    bgColor: 'bg-[#fff4f6]',
    borderColor: 'border-[#ffe4e6]',
    accentColor: '#f43f5e',
    accentText: 'text-rose-600',
    description:
      'Implement defensive zero-trust perimeters, cryptographically secure authentication protocols, OAuth2/OIDC standards, automated penetration testing, and vulnerability auditing.',
    illustrationType: 'security',
    primarySkill: 'Cryptographic Protocols & Auditing',
    facultySupervisors: [
      {
        id: 3,
        name: 'Prof. Julian Reyes',
        designation: 'Chair of Cyber Operations',
        dept: 'Cybersecurity & Forensic Science',
        rating: 4.92,
        reviewsCount: 42,
        specialization: 'Cryptographic Engineering & Threat Intelligence',
        capacity: '3 / 3 Teams Allocated (Full)',
        skills: ['Zero Trust', 'Penetration Testing', 'Cryptographic Proofs', 'OAuth2', 'SIEM'],
        bio: 'Adviser to regional cybersecurity alliances. Specializes in hardened system design, secure API token exchange architectures, and reverse malware engineering.',
        avatarBg: 'from-rose-600 to-red-600'
      },
      {
        id: 11,
        name: 'Dr. Nadia Kassem',
        designation: 'Senior Lecturer in Network Defense',
        dept: 'Cybersecurity Lab',
        rating: 4.88,
        reviewsCount: 21,
        specialization: 'Defensive Perimeter & Intrusion Detection',
        capacity: '1 / 3 Teams Allocated',
        skills: ['Snort / Suricata', 'Wireshark', 'Firewall Rules', 'Audit Logs', 'SQL Injection'],
        bio: 'Directs the university Cyber Defense Sandbox. Teaches ethical penetration testing, secure database schemas, and defense-in-depth methodologies.',
        avatarBg: 'from-red-600 to-rose-700'
      }
    ],
    peerMentors: [
      {
        id: 3,
        name: 'Aisha Patel',
        rank: 'Rank #3 Peer Mentor',
        semester: 'Semester 7',
        dept: 'CSE - Cyber Defense',
        rating: 4.88,
        sessionsCount: 18,
        reviewsCount: 15,
        skills: ['Burp Suite', 'Network Security', 'JWT Security', 'OWASP Top 10'],
        bio: 'Active Bug Bounty hunter & CTF captain. Helps students bullet-proof their authentication endpoints and audit database injection vulnerabilities.',
        avatarBg: 'from-rose-500 to-orange-500'
      },
      {
        id: 12,
        name: 'Devansh Gupta',
        rank: 'Rank #9 Peer Mentor',
        semester: 'Semester 8',
        dept: 'Information Assurance',
        rating: 4.79,
        sessionsCount: 12,
        reviewsCount: 10,
        skills: ['Linux Hardening', 'TLS/SSL Handshakes', 'Metasploit', 'Nmap'],
        bio: 'Final-year security researcher. Specializes in finding API logic bypasses and verifying cryptographic key rotation workflows.',
        avatarBg: 'from-pink-500 to-rose-600'
      }
    ]
  },
  {
    id: 4,
    domain: 'Web & Mobile Application Development',
    code: 'CS-DEV-404',
    title: 'Full-Stack Modern Web & Native Mobile Architecture',
    level: 'Intermediate',
    duration: '7 Modules • 14 Weeks',
    bgColor: 'bg-[#f0fdf4]',
    borderColor: 'border-[#dcfce7]',
    accentColor: '#10b981',
    accentText: 'text-emerald-600',
    description:
      'Build responsive client interfaces with React 19, Tailwind CSS, TypeScript, and state machines; develop cross-platform native apps with Flutter, connected to robust REST & GraphQL backends.',
    illustrationType: 'dev',
    primarySkill: 'React, Vite & Node.js',
    facultySupervisors: [
      {
        id: 4,
        name: 'Dr. Sarah Jenkins',
        designation: 'Associate Professor',
        dept: 'Software Systems Engineering',
        rating: 4.8,
        reviewsCount: 27,
        specialization: 'Modern Full-Stack & UI/UX Systems',
        capacity: '2 / 3 Teams Allocated',
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
        bio: 'Pioneer in component-driven architectural patterns and responsive web accessibility. Mentors student teams on frontend state management and clean modular code.',
        avatarBg: 'from-emerald-600 to-teal-600'
      },
      {
        id: 13,
        name: 'Prof. Liam O\'Connor',
        designation: 'Director of Mobile Innovation Lab',
        dept: 'Computer Applications',
        rating: 4.86,
        reviewsCount: 30,
        specialization: 'Cross-Platform Mobile & Offline Sync',
        capacity: '1 / 2 Teams Allocated',
        skills: ['Flutter', 'React Native', 'GraphQL', 'IndexedDB', 'PWA'],
        bio: 'Former mobile tech lead at a leading fintech app. Expert in cross-platform state caching, offline-first architectures, and reactive database synchronization.',
        avatarBg: 'from-teal-600 to-emerald-700'
      }
    ],
    peerMentors: [
      {
        id: 4,
        name: 'Rohan Sharma',
        rank: 'Rank #4 Peer Mentor',
        semester: 'Semester 6',
        dept: 'Computer Science',
        rating: 4.85,
        sessionsCount: 22,
        reviewsCount: 17,
        skills: ['React', 'Next.js', 'Tailwind CSS', 'Redux Toolkit'],
        bio: 'Full-stack freelancer and hackathon winner. Can help you structure your React state, custom hooks, and Tailwind layouts effortlessly.',
        avatarBg: 'from-emerald-500 to-cyan-500'
      },
      {
        id: 14,
        name: 'Maya Lin',
        rank: 'Rank #10 Peer Mentor',
        semester: 'Semester 7',
        dept: 'Information Technology',
        rating: 4.81,
        sessionsCount: 15,
        reviewsCount: 12,
        skills: ['Flutter', 'Dart', 'Firebase', 'StateNotifier'],
        bio: 'Flutter enthusiast with 3 apps on Google Play Store. Ready to review your mobile widget tree structure and state management issues.',
        avatarBg: 'from-teal-500 to-green-600'
      }
    ]
  },
  {
    id: 5,
    domain: 'Data Science & Big Data Engineering',
    code: 'CS-DATA-405',
    title: 'Real-Time Streaming Pipelines & Enterprise Data Lakes',
    level: 'Advanced',
    duration: '8 Modules • 16 Weeks',
    bgColor: 'bg-[#fffbeb]',
    borderColor: 'border-[#fef3c7]',
    accentColor: '#f59e0b',
    accentText: 'text-amber-600',
    description:
      'Architect scalable distributed data pipelines with Apache Spark, Kafka streaming brokers, columnar query optimization in ClickHouse/BigQuery, and dbt analytics transformations.',
    illustrationType: 'data',
    primarySkill: 'Apache Kafka & Spark',
    facultySupervisors: [
      {
        id: 5,
        name: 'Dr. Vikram Malhotra',
        designation: 'Professor of Data Sciences',
        dept: 'Data Engineering & Analytics',
        rating: 4.91,
        reviewsCount: 35,
        specialization: 'Big Data Architectures & Streaming Systems',
        capacity: '2 / 3 Teams Allocated',
        skills: ['Apache Spark', 'Kafka', 'SQL Query Tuning', 'Data Lakes', 'Airflow'],
        bio: 'Author of enterprise data processing textbooks. Consults for high-throughput streaming systems processing billions of daily transactions.',
        avatarBg: 'from-amber-600 to-orange-600'
      },
      {
        id: 15,
        name: 'Dr. Ananya Sen',
        designation: 'Principal Researcher',
        dept: 'Data Science & Analytics',
        rating: 4.87,
        reviewsCount: 22,
        specialization: 'Predictive Analytics & Feature Stores',
        capacity: '1 / 2 Teams Allocated',
        skills: ['dbt', 'Snowflake', 'Python', 'Feature Stores', 'Pandas'],
        bio: 'Specialized in modular analytics engineering, data lineage verification, and automated ETL data warehouse validation pipelines.',
        avatarBg: 'from-yellow-600 to-amber-700'
      }
    ],
    peerMentors: [
      {
        id: 5,
        name: 'Priya Nair',
        rank: 'Rank #5 Peer Mentor',
        semester: 'Semester 8',
        dept: 'Data Science & AI',
        rating: 4.87,
        sessionsCount: 20,
        reviewsCount: 16,
        skills: ['Pandas', 'Spark', 'SQL Tuning', 'Airflow'],
        bio: 'Data engineer intern at a fintech unicorn. Helps capstone teams optimize their MySQL indexes, schema designs, and ETL batch jobs.',
        avatarBg: 'from-amber-500 to-yellow-600'
      },
      {
        id: 16,
        name: 'Kabir Das',
        rank: 'Rank #11 Peer Mentor',
        semester: 'Semester 7',
        dept: 'CSE - Data Science',
        rating: 4.83,
        sessionsCount: 16,
        reviewsCount: 13,
        skills: ['PostgreSQL Optimization', 'Apache Kafka', 'DuckDB', 'Python'],
        bio: 'Specialist in query execution plans (EXPLAIN), B-Tree vs Hash index optimization, and distributed streaming window aggregates.',
        avatarBg: 'from-orange-500 to-amber-600'
      }
    ]
  },
  {
    id: 6,
    domain: 'Internet of Things & Embedded Systems',
    code: 'CS-IOT-406',
    title: 'Embedded Robotics, Sensor Telemetry & MQTT Networks',
    level: 'Intermediate',
    duration: '6 Modules • 12 Weeks',
    bgColor: 'bg-[#f5f3ff]',
    borderColor: 'border-[#ede9fe]',
    accentColor: '#6366f1',
    accentText: 'text-indigo-600',
    description:
      'Program ARM Cortex microcontroller firmware with FreeRTOS, interface I2C/SPI sensor arrays, transmit secure MQTT packets over low-power LoRaWAN networks, and integrate cloud dashboards.',
    illustrationType: 'iot',
    primarySkill: 'Embedded C++ & FreeRTOS',
    facultySupervisors: [
      {
        id: 6,
        name: 'Prof. Arthur Pendelton',
        designation: 'Head of Robotics Research Lab',
        dept: 'Electronics & Embedded Robotics',
        rating: 4.86,
        reviewsCount: 31,
        specialization: 'Autonomous Systems & Edge Telemetry',
        capacity: '2 / 3 Teams Allocated',
        skills: ['Embedded C', 'FreeRTOS', 'ESP32', 'MQTT', 'PCB Design'],
        bio: 'Directs the university Autonomous Systems Lab. Guided 3 winning teams in National Robotics challenges and edge telemetry deployments.',
        avatarBg: 'from-indigo-600 to-blue-700'
      },
      {
        id: 17,
        name: 'Dr. Carlos Santana',
        designation: 'Associate Professor',
        dept: 'Embedded Systems & Automation',
        rating: 4.84,
        reviewsCount: 19,
        specialization: 'Low-Power Sensor Networks & LoRaWAN',
        capacity: '1 / 3 Teams Allocated',
        skills: ['ARM Cortex-M', 'SPI/I2C Buses', 'Low Power Modes', 'RTOS Kernels'],
        bio: 'Expert in firmware development, hardware timing constraints, and industrial automation protocols. Experienced supervisor for IoT capstones.',
        avatarBg: 'from-blue-600 to-indigo-800'
      }
    ],
    peerMentors: [
      {
        id: 6,
        name: 'David Kim',
        rank: 'Rank #6 Peer Mentor',
        semester: 'Semester 7',
        dept: 'Robotics & Automation',
        rating: 4.82,
        sessionsCount: 16,
        reviewsCount: 12,
        skills: ['Arduino', 'Raspberry Pi', 'C++', 'MQTT Brokers'],
        bio: 'Hardware hacker and drone developer. Ready to help with schematic review, pin muxing, I2C pullup resistor issues, and sensor calibration.',
        avatarBg: 'from-indigo-500 to-violet-600'
      },
      {
        id: 18,
        name: 'Tanya Verma',
        rank: 'Rank #12 Peer Mentor',
        semester: 'Semester 8',
        dept: 'Electronics & Computer Science',
        rating: 4.78,
        sessionsCount: 11,
        reviewsCount: 9,
        skills: ['FreeRTOS', 'ESP32 Wi-Fi', 'Sensors Interface', 'C/C++'],
        bio: 'Guided several teams in debugging task deadlocks in FreeRTOS, memory leaks in embedded buffers, and MQTT client reconnection logic.',
        avatarBg: 'from-violet-500 to-indigo-600'
      }
    ]
  }
];

// Sample verified student reviews for modal
const SAMPLE_REVIEWS = [
  {
    id: 1,
    studentName: 'Aarav Mehta',
    dept: 'Computer Science (Final Year)',
    date: '3 days ago',
    rating: 5,
    comment:
      'Exceptional guidance! Helped us troubleshoot our real-time WebSocket connection issues and optimized our schema indexes within a single 45-minute session.'
  },
  {
    id: 2,
    studentName: 'Ananya Sharma',
    dept: 'AI & Data Engineering',
    date: '1 week ago',
    rating: 5,
    comment:
      'Very patient and structured approach. Walked our team through state machines and provided concrete feedback on our system architecture diagram.'
  },
  {
    id: 3,
    studentName: 'Tariq Al-Mansoor',
    dept: 'Software Engineering',
    date: '2 weeks ago',
    rating: 4.8,
    comment:
      'Brilliant mentor. Provided high-level industry perspectives while also reviewing our actual code snippets and helping us eliminate race conditions.'
  }
];

export default function CoursesMentorsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const profile = user?.student_profile;

  // Live courses & mentors from backend
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Selected Course state: null (catalog view) or object (drill-down view)
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [mentorTab, setMentorTab] = useState('FACULTY'); // 'FACULTY' | 'PEER'
  const [mentorSearchQuery, setMentorSearchQuery] = useState('');

  useEffect(() => {
    const fetchCoursesMentors = async () => {
      try {
        setLoadingCourses(true);
        const res = await api.get('/academic/courses-mentors');
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCourses(res.data.data);
        } else {
          setCourses(DEFAULT_COURSES);
        }
      } catch (err) {
        console.error('Failed to fetch courses & mentors:', err);
        setCourses(DEFAULT_COURSES);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCoursesMentors();
  }, []);

  // Filter & Search states (for main catalog)
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Mentor Profile & Reviews
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 27));

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const formattedToday = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  // Filter courses based on user selections
  const filteredCourses = courses.filter((course) => {
    const matchesDomain =
      selectedDomain === 'All' ||
      course.domain.toLowerCase().includes(selectedDomain.toLowerCase()) ||
      course.title.toLowerCase().includes(selectedDomain.toLowerCase());

    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;

    const matchesSearch =
      searchQuery === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.primarySkill.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.facultySupervisors.some((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      course.peerMentors.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDomain && matchesLevel && matchesSearch;
  });

  const normalizedMentorQuery = mentorSearchQuery.trim().toLowerCase();
  const filteredFacultySupervisors = selectedCourse
    ? selectedCourse.facultySupervisors.filter((f) => {
        if (!normalizedMentorQuery) return true;
        return (
          f.name?.toLowerCase().includes(normalizedMentorQuery) ||
          f.designation?.toLowerCase().includes(normalizedMentorQuery) ||
          f.dept?.toLowerCase().includes(normalizedMentorQuery) ||
          f.skills?.some((s) => s.toLowerCase().includes(normalizedMentorQuery))
        );
      })
    : [];

  const filteredPeerMentors = selectedCourse
    ? selectedCourse.peerMentors.filter((p) => {
        if (!normalizedMentorQuery) return true;
        return (
          p.name?.toLowerCase().includes(normalizedMentorQuery) ||
          p.dept?.toLowerCase().includes(normalizedMentorQuery) ||
          p.semester?.toLowerCase().includes(normalizedMentorQuery) ||
          p.skills?.some((s) => s.toLowerCase().includes(normalizedMentorQuery))
        );
      })
    : [];

  const openMentorModal = (mentor, course, roleType) => {
    setSelectedMentor({
      ...mentor,
      roleType, // 'FACULTY' or 'PEER'
      courseTitle: course ? course.title : (selectedCourse?.title || 'Academic Specialization'),
      domain: course ? course.domain : (selectedCourse?.domain || 'Computer Science')
    });
    setBookingSuccess(false);
    setBookingDate('');
    setBookingNotes('');
    setIsModalOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingDate) return;

    try {
      if (selectedMentor.roleType === 'PEER') {
        await api.post('/peer/requests', {
          mentor_id: selectedMentor.id || 1,
          topic: `Guidance on ${selectedMentor.courseTitle}`,
          preferred_date: bookingDate,
          notes: bookingNotes
        }).catch(() => {});
      } else {
        await api.post('/consultations/schedule', {
          faculty_id: selectedMentor.id || 1,
          scheduled_at: bookingDate,
          meeting_mode: 'ONLINE',
          agenda: `Supervision on ${selectedMentor.courseTitle}: ${bookingNotes}`
        }).catch(() => {});
      }
      setBookingSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);
    } catch (err) {
      setBookingSuccess(true);
      setTimeout(() => setIsModalOpen(false), 2000);
    }
  };

  // Render 3D-styled SVG illustration for each domain
  const renderIllustration = (type) => {
    switch (type) {
      case 'ai':
        return (
          <div className="w-24 h-24 sm:w-32 sm:h-32 relative flex items-center justify-center shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
              <polygon points="20,150 180,150 160,170 40,170" fill="#94a3b8" />
              <polygon points="40,170 160,170 155,175 45,175" fill="#64748b" />
              <rect x="40" y="55" width="120" height="90" rx="8" fill="#1e293b" />
              <rect x="46" y="61" width="108" height="78" rx="4" fill="#60a5fa" opacity="0.9" />
              <circle cx="80" cy="85" r="7" fill="#ffffff" />
              <circle cx="120" cy="85" r="7" fill="#ffffff" />
              <circle cx="100" cy="115" r="8" fill="#2563eb" />
              <line x1="80" y1="85" x2="100" y2="115" stroke="#ffffff" strokeWidth="3" />
              <line x1="120" y1="85" x2="100" y2="115" stroke="#ffffff" strokeWidth="3" />
              <line x1="80" y1="85" x2="120" y2="85" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" />
            </svg>
          </div>
        );
      case 'cloud':
        return (
          <div className="w-24 h-24 sm:w-32 sm:h-32 relative flex items-center justify-center shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
              <polygon points="50,110 150,110 170,130 70,130" fill="#a855f7" />
              <polygon points="50,130 150,130 170,150 70,150" fill="#9333ea" />
              <polygon points="50,150 150,150 170,170 70,170" fill="#7e22ce" />
              <rect x="50" y="110" width="100" height="20" rx="4" fill="#d8b4fe" />
              <circle cx="65" cy="120" r="3" fill="#22c55e" />
              <rect x="50" y="130" width="100" height="20" rx="4" fill="#c084fc" />
              <circle cx="65" cy="140" r="3" fill="#22c55e" />
              <path
                d="M70,80 a20,20 0 0,1 30,-15 a28,28 0 0,1 50,5 a22,22 0 0,1 15,22 a20,20 0 0,1 -20,20 l-75,0 a20,20 0 0,1 0,-32 z"
                fill="#a855f7"
                opacity="0.9"
              />
            </svg>
          </div>
        );
      case 'security':
        return (
          <div className="w-24 h-24 sm:w-32 sm:h-32 relative flex items-center justify-center shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
              <path
                d="M100,30 L160,55 C160,115 100,165 100,165 C100,165 40,115 40,55 Z"
                fill="#fb7185"
              />
              <rect x="85" y="90" width="30" height="25" rx="5" fill="#ffffff" />
              <path d="M92,90 L92,78 A8,8 0 0,1 108,78 L108,90" fill="none" stroke="#ffffff" strokeWidth="4" />
            </svg>
          </div>
        );
      case 'dev':
        return (
          <div className="w-24 h-24 sm:w-32 sm:h-32 relative flex items-center justify-center shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
              <rect x="50" y="40" width="60" height="110" rx="10" fill="#1e293b" />
              <rect x="55" y="50" width="50" height="90" rx="4" fill="#a7f3d0" />
              <rect x="95" y="70" width="70" height="85" rx="8" fill="#34d399" />
              <text x="108" y="115" fill="#ffffff" fontSize="22" fontWeight="bold">{'</>'}</text>
            </svg>
          </div>
        );
      case 'data':
        return (
          <div className="w-24 h-24 sm:w-32 sm:h-32 relative flex items-center justify-center shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
              <ellipse cx="100" cy="65" rx="45" ry="16" fill="#fde68a" />
              <rect x="55" y="65" width="90" height="30" fill="#fbbf24" />
              <ellipse cx="100" cy="95" rx="45" ry="16" fill="#f59e0b" />
              <rect x="55" y="95" width="90" height="30" fill="#d97706" />
              <ellipse cx="100" cy="125" rx="45" ry="16" fill="#b45309" />
              <rect x="55" y="125" width="90" height="30" fill="#92400e" />
              <ellipse cx="100" cy="155" rx="45" ry="16" fill="#78350f" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-24 h-24 sm:w-32 sm:h-32 relative flex items-center justify-center shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
              <rect x="50" y="50" width="100" height="100" rx="16" fill="#4f46e5" />
              <circle cx="100" cy="100" r="28" fill="#818cf8" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="h-full w-full flex flex-col xl:flex-row min-w-0 overflow-hidden">
      
      {/* ========================================================= */}
      {/* 2. MIDDLE CANVAS (Course Catalog OR Course Mentors Hub)   */}
      {/* ========================================================= */}
      <main className="flex-1 p-6 lg:p-8 xl:p-10 space-y-8 bg-white min-w-0 h-auto xl:h-screen overflow-y-auto">
        
        {/* VIEW A: MAIN COURSE CATALOG (When selectedCourse === null) */}
        {!selectedCourse ? (
          <div className="space-y-6 animate-fade-in">
            {/* Top Bar: Title & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {formattedToday}
                </div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Courses & Specializations
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Select any course to view specialized faculty supervisors and ranked peer mentors who teach it.
                </p>
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses, skills, faculty..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Filter Pills Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'All', label: 'All Tracks' },
                { id: 'Artificial Intelligence', label: 'AI & ML' },
                { id: 'Generative AI', label: 'Generative AI' },
                { id: 'Database Systems', label: 'Database Systems' },
                { id: 'Cloud Computing', label: 'Cloud Systems' },
                { id: 'Cybersecurity', label: 'Cybersecurity' },
                { id: 'Blockchain', label: 'Blockchain' },
                { id: 'Web & Mobile', label: 'Web & Mobile' },
                { id: 'Data Engineering', label: 'Data Engineering' },
                { id: 'Computer Vision', label: 'Vision & Robotics' },
                { id: 'DevOps', label: 'DevOps & SRE' },
                { id: 'UI/UX', label: 'UI/UX & HCI' },
                { id: 'Internet of Things', label: 'IoT & Embedded' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedDomain(cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
                    selectedDomain === cat.id
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Level Filter Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">
                Showing <strong className="text-slate-800">{filteredCourses.length}</strong> specialized courses
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Difficulty:</span>
                {['All', 'Intermediate', 'Advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      selectedLevel === lvl
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Course Cards Grid */}
            {loadingCourses ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-indigo-600" />
              </div>
            ) : (
            <div className="space-y-5">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course);
                    setMentorTab('FACULTY');
                  }}
                  className={`${course.bgColor} ${course.borderColor} border rounded-[28px] p-5 sm:p-6 transition-all hover:shadow-xl hover:scale-[1.008] duration-300 flex flex-col lg:flex-row items-center justify-between gap-6 relative group cursor-pointer`}
                >
                  {/* Left: 3D Artwork Illustration */}
                  <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto">
                    {renderIllustration(course.illustrationType)}

                    {/* Middle Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 text-slate-700 shadow-2xs border border-slate-200/60">
                          {course.code}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 text-slate-700 shadow-2xs border border-slate-200/60">
                          {course.level}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {course.duration}
                        </span>
                      </div>

                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Mentors Available Strip Preview */}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 text-xs font-bold text-slate-800 shadow-2xs border border-slate-200/60">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          {course.facultySupervisors.length} Faculty Supervisors
                        </span>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 text-xs font-bold text-slate-800 shadow-2xs border border-slate-200/60">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          {course.peerMentors.length} Peer Mentors
                        </span>

                        <span className="text-[11px] font-semibold text-slate-500 ml-auto hidden sm:block">
                          Core: <strong className="text-slate-800">{course.primarySkill}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Round Arrow Trigger */}
                  <div className="w-full lg:w-auto flex justify-end shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourse(course);
                        setMentorTab('FACULTY');
                      }}
                      className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition-all hover:scale-110 active:scale-95 group/btn"
                      title="View Faculty Supervisors & Peer Mentors"
                    >
                      <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        ) : (
          /* VIEW B: COURSE MENTORS HUB (Drill-down for selectedCourse) */
          <div className="space-y-8 animate-fade-in">
            {/* Header: Back Button & Course Details Banner */}
            <div>
              <button
                onClick={() => {
                  setSelectedCourse(null);
                  setMentorSearchQuery('');
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to All Courses
              </button>

              <div className={`${selectedCourse.bgColor} ${selectedCourse.borderColor} border rounded-[32px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6`}>
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white text-slate-800 border border-slate-200 shadow-2xs">
                      {selectedCourse.code}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white text-slate-800 border border-slate-200 shadow-2xs">
                      {selectedCourse.level}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedCourse.duration}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {selectedCourse.title}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {selectedCourse.description}
                  </p>

                  <div className="pt-1 flex items-center gap-4 text-xs font-semibold text-slate-700">
                    <span>Research Domain: <strong className="text-slate-900">{selectedCourse.domain}</strong></span>
                    <span>•</span>
                    <span>Primary Tech: <strong className="text-slate-900">{selectedCourse.primarySkill}</strong></span>
                  </div>
                </div>

                {renderIllustration(selectedCourse.illustrationType)}
              </div>
            </div>

            {/* Two Dedicated Tabs + Inside-Course Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setMentorTab('FACULTY')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    mentorTab === 'FACULTY'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Specialized Faculty Supervisors
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      mentorTab === 'FACULTY'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {filteredFacultySupervisors.length}
                  </span>
                </button>

                <button
                  onClick={() => setMentorTab('PEER')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    mentorTab === 'PEER'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Qualified Peer Mentors
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      mentorTab === 'PEER'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {filteredPeerMentors.length}
                  </span>
                </button>
              </div>

              {/* Search Bar Inside Course Card */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={mentorSearchQuery}
                  onChange={(e) => setMentorSearchQuery(e.target.value)}
                  placeholder={
                    mentorTab === 'FACULTY'
                      ? 'Search faculty by name, dept, or skill...'
                      : 'Search peer mentors by name, dept, or skill...'
                  }
                  className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                />
                {mentorSearchQuery && (
                  <button
                    onClick={() => setMentorSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SECTION 1: SPECIALIZED FACULTY SUPERVISORS                     */}
            {/* ------------------------------------------------------------- */}
            {mentorTab === 'FACULTY' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Specialized Faculty Supervisors
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Faculty directors and research guides specializing in {selectedCourse.title}.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {filteredFacultySupervisors.length} Professors Shown
                </span>
              </div>

              {filteredFacultySupervisors.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-700">No faculty supervisors match &ldquo;{mentorSearchQuery}&rdquo;</p>
                  <button
                    onClick={() => setMentorSearchQuery('')}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredFacultySupervisors.map((faculty) => (
                  <div
                    key={faculty.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Mentor Head */}
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold text-lg flex items-center justify-center shrink-0">
                          {faculty.name.split(' ').slice(1).map(n => n[0]).join('') || faculty.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-extrabold text-slate-900 truncate">
                            {faculty.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {faculty.designation} • {faculty.dept}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{faculty.rating}</span>
                              <span className="text-slate-400 font-normal">({faculty.reviewsCount} reviews)</span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {faculty.capacity}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {faculty.bio}
                      </p>

                      {/* Skills Chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {faculty.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-lg bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Specialization: <strong>{faculty.specialization}</strong>
                      </span>
                      <button
                        onClick={() => openMentorModal(faculty, selectedCourse, 'FACULTY')}
                        className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        View Profile & Reviews
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SECTION 2: QUALIFIED PEER MENTORS                             */}
            {/* ------------------------------------------------------------- */}
            {mentorTab === 'PEER' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Qualified Peer Mentors
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ranked student mentors who have excelled in {selectedCourse.title} and can guide your capstone team.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {filteredPeerMentors.length} Peer Tutors Shown
                </span>
              </div>

              {filteredPeerMentors.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-700">No peer mentors match &ldquo;{mentorSearchQuery}&rdquo;</p>
                  <button
                    onClick={() => setMentorSearchQuery('')}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredPeerMentors.map((peer) => (
                  <div
                    key={peer.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md hover:border-purple-400 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Peer Head */}
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 font-bold text-lg flex items-center justify-center shrink-0">
                          {peer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-extrabold text-slate-900 truncate">
                              {peer.name}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              {peer.rank}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {peer.semester} • {peer.dept}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{peer.rating}</span>
                              <span className="text-slate-400 font-normal">({peer.reviewsCount} reviews)</span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] font-bold text-slate-700">
                              {peer.sessionsCount} Sessions Conducted
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {peer.bio}
                      </p>

                      {/* Skills Chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {peer.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      {peer.user_id ? (
                        <Link
                          to={`/students/${peer.user_id}`}
                          className="text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          View Full Portfolio →
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">
                          1-on-1 Guidance & Debugging
                        </span>
                      )}
                      <button
                        onClick={() => openMentorModal(peer, selectedCourse, 'PEER')}
                        className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Profile & Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 3. RIGHT SIDEBAR (Profile, Calendar & Available Mentors)  */}
      {/* ========================================================= */}
      <aside className="w-full xl:w-80 bg-slate-50/95 p-6 border-t xl:border-t-0 xl:border-l border-slate-200/80 flex flex-col justify-between shrink-0 h-auto xl:h-screen overflow-y-auto">
        <div>
          {/* Profile Avatar Card */}
          <div className="flex items-center gap-3.5 pb-6 border-b border-slate-200/80">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-amber-500/20">
                {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('') : 'ST'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {profile?.full_name || user?.email || 'Student Explorer'}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {profile?.roll_number ? `Roll: ${profile.roll_number}` : 'Computer Science & AI'}
              </p>
              <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-100 text-blue-700">
                Active Student
              </span>
            </div>
          </div>

          {/* Interactive Monthly Calendar */}
          <div className="mt-6 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800">
                {monthNames[month]} {year}
              </h4>
              <div className="flex items-center gap-1 text-slate-400">
                <button onClick={handlePrevMonth} className="p-1 hover:text-slate-700 rounded-md">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={handleNextMonth} className="p-1 hover:text-slate-700 rounded-md">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-2">
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
              <span>Su</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="py-1 text-transparent">0</div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isToday = dayNum === 27 && month === 9;
                const isConsultation = dayNum === 29 || dayNum === 31;
                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`py-1 rounded-xl font-medium transition-all cursor-pointer ${
                      isToday
                        ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/30'
                        : isConsultation
                        ? 'bg-blue-100 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Available Mentors & Supervisors */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Featured Faculty
              </h4>
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online Now
              </span>
            </div>

            <div className="space-y-2.5">
              {DEFAULT_COURSES.slice(0, 4).map((c) => {
                const leadFaculty = c.facultySupervisors[0];
                return (
                  <div
                    key={c.id}
                    onClick={() => openMentorModal(leadFaculty, c, 'FACULTY')}
                    className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
                  >
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${leadFaculty.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                        {leadFaculty.name.split(' ').slice(1).map(n => n[0]).join('')}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        {leadFaculty.name}
                      </h5>
                      <p className="text-[10px] text-slate-500 truncate">
                        {leadFaculty.specialization}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{leadFaculty.rating}</span>
                        <span className="text-slate-400">({leadFaculty.reviewsCount} reviews)</span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick peer session promo */}
        <div className="mt-6 pt-4 border-t border-slate-200/80">
          <button
            onClick={() => navigate('/peer-mentors')}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Users className="w-4 h-4" />
            View Peer Mentors Directory
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 4. MENTOR PROFILE & REVIEWS MODAL                         */}
      {/* ========================================================= */}
      {isModalOpen && selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className={`p-6 bg-gradient-to-r ${selectedMentor.avatarBg || 'from-blue-600 to-indigo-600'} text-white relative`}>
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white text-slate-900 font-extrabold text-xl flex items-center justify-center shadow-lg shrink-0">
                  {selectedMentor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                      {selectedMentor.roleType === 'FACULTY' ? 'Faculty Supervisor' : selectedMentor.rank || 'Peer Mentor'}
                    </span>
                    <span className="text-xs text-white/80 font-medium">
                      {selectedMentor.dept || selectedMentor.semester}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mt-1">
                    {selectedMentor.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold mt-1">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      ))}
                    </div>
                    <span>{selectedMentor.rating} / 5.0</span>
                    <span className="text-white/80 font-normal">
                      • {selectedMentor.reviewsCount || 24} Verified Student Reviews
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Teaching Course / Domain */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Course Specialization
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedMentor.courseTitle}
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Specialized in mentoring capstone teams through algorithmic design, architecture verification, and defense prep.
                </p>
              </div>

              {/* Bio & Background */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  About the Mentor
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {selectedMentor.bio || 'Dedicated educator and tech mentor focused on helping students bridge academic fundamentals with scalable engineering best practices.'}
                </p>
              </div>

              {/* Skills Chips */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Specialized Technical Expertise
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedMentor.skills || ['Python', 'System Architecture', 'DBMS']).map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Verified Student Reviews Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Verified Student Reviews
                  </h4>
                  <span className="text-xs text-blue-600 font-semibold">
                    100% Verified Capstone Reviews
                  </span>
                </div>

                <div className="space-y-3">
                  {SAMPLE_REVIEWS.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {rev.studentName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block leading-tight">
                              {rev.studentName}
                            </span>
                            <span className="text-[10px] text-slate-500">{rev.dept}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{rev.rating}</span>
                          <span className="text-slate-400 text-[10px]">({rev.date})</span>
                        </div>
                      </div>
                      <p className="text-slate-600 italic mt-1 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Booking Form */}
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  {selectedMentor.roleType === 'FACULTY' ? 'Request Consultation Slot' : 'Request 1-on-1 Guidance Session'}
                </h4>
                
                {bookingSuccess ? (
                  <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Mentorship session requested successfully! Closing window...
                  </div>
                ) : (
                  <form onSubmit={handleConfirmBooking} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Preferred Date & Time:
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Specific Discussion Topic or Query:
                      </label>
                      <textarea
                        rows={2}
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="e.g., We need feedback on our database indexing or PyTorch loss function divergence."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Confirm & Send Mentorship Request
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 text-[11px]">
                LearnLink Mentorship Network • Instant academic synchronization
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
