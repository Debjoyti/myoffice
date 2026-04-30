export const JOBS = [
  { id:'j1', title:'Senior ML Engineer', company:'DeepMind India', logo:'D', logoColor:'#4f46e5', location:'Bengaluru · Hybrid', type:'Full-time', salary:'₹45L – ₹80L', postedDays:2, applicants:143, minRating:4.2, experience:'5–8 yrs', category:'AI-ML', skills:['Python','PyTorch','Transformers','RLHF','MLOps'], description:`**Role:** Lead ML research engineering for frontier language models.\n\n**Responsibilities:**\n- Design large-scale LLM training pipelines\n- Build evaluation frameworks for model capabilities\n- Collaborate on alignment and safety research\n- Optimise inference serving infrastructure\n\n**Requirements:**\n- 5+ years ML engineering with LLM experience\n- Proficiency in Python, PyTorch, distributed training (DeepSpeed)\n- Publications or equivalent research output preferred\n- Minimum peer rating: 4.2` },
  { id:'j2', title:'Product Manager – AI Products', company:'Razorpay', logo:'R', logoColor:'#0891b2', location:'Bengaluru · On-site', type:'Full-time', salary:'₹35L – ₹55L', postedDays:5, applicants:89, minRating:3.8, experience:'4–7 yrs', category:'Product', skills:['Product Strategy','AI/ML','Payments','SQL','Roadmapping'], description:`**Role:** Lead AI-powered financial products at Razorpay.\n\n**Responsibilities:**\n- Define and own the AI product roadmap\n- Work with data science and engineering to ship ML features\n- Drive GTM for new AI product launches\n- Define success metrics and run experiments\n\n**Requirements:**\n- 4+ years PM experience\n- Strong SQL and analytical skills\n- Experience shipping AI/ML features\n- Minimum peer rating: 3.8` },
  { id:'j3', title:'Full-stack Engineer', company:'Zepto', logo:'Z', logoColor:'#7c3aed', location:'Mumbai · Remote', type:'Remote', salary:'₹28L – ₹45L', postedDays:1, applicants:211, minRating:3.5, experience:'3–6 yrs', category:'Engineering', skills:['React','Node.js','PostgreSQL','Redis','AWS'], description:`**Role:** Core platform team powering 10-minute delivery at scale.\n\n**Responsibilities:**\n- Build and maintain React customer-facing apps\n- Design backend services in Node.js\n- Work on real-time inventory systems\n- Collaborate in a fast-paced startup environment\n\n**Requirements:**\n- 3+ years full-stack experience\n- Proficiency in React and Node.js\n- Experience with high-throughput distributed systems\n- Minimum peer rating: 3.5` },
  { id:'j4', title:'Data Scientist – NLP', company:'Sarvam AI', logo:'S', logoColor:'#059669', location:'Bengaluru · Hybrid', type:'Full-time', salary:'₹30L – ₹50L', postedDays:3, applicants:67, minRating:4.0, experience:'2–5 yrs', category:'AI-ML', skills:['NLP','Python','Indic Languages','Hugging Face','Fine-tuning'], description:`**Role:** Build NLP models for Indic languages at India's leading AI lab.\n\n**Responsibilities:**\n- Fine-tune multilingual transformer models\n- Build evaluation datasets for low-resource languages\n- Research SOTA NLP techniques for Indian languages\n- Collaborate with linguists and domain experts\n\n**Requirements:**\n- Strong NLP background with transformer models\n- Experience with multilingual/cross-lingual models\n- Knowledge of Indian languages preferred\n- Minimum peer rating: 4.0` },
  { id:'j5', title:'iOS Engineer', company:'CRED', logo:'C', logoColor:'#dc2626', location:'Bengaluru · On-site', type:'Full-time', salary:'₹32L – ₹52L', postedDays:7, applicants:98, minRating:3.9, experience:'3–6 yrs', category:'Engineering', skills:['Swift','SwiftUI','Core Data','CI/CD','XCTest'], description:`**Role:** Build premium iOS experiences for India's top credit card users.\n\n**Responsibilities:**\n- Architect and build SwiftUI-based features\n- Optimise app performance and crash rates\n- Write comprehensive unit and UI tests\n- Mentor junior engineers\n\n**Requirements:**\n- 3+ years iOS development\n- Strong Swift and SwiftUI skills\n- CI/CD pipeline experience\n- Minimum peer rating: 3.9` },
  { id:'j6', title:'DevOps / Platform Engineer', company:'Groww', logo:'G', logoColor:'#16a34a', location:'Remote', type:'Remote', salary:'₹25L – ₹40L', postedDays:4, applicants:55, minRating:3.6, experience:'3–7 yrs', category:'Engineering', skills:['Kubernetes','Terraform','AWS','Prometheus','Go'], description:`**Role:** Scale infrastructure for 20M+ investors on Groww.\n\n**Responsibilities:**\n- Manage Kubernetes clusters at scale\n- Build internal developer platforms\n- Implement SRE best practices\n- Automate infrastructure with Terraform\n\n**Requirements:**\n- 3+ years DevOps/SRE experience\n- Deep Kubernetes and AWS expertise\n- Observability stack experience\n- Minimum peer rating: 3.6` },
];

export const COMPANIES = [
  { name:'DeepMind India', logo:'D', color:'#4f46e5', industry:'AI Research', openRoles:8, rating:4.8 },
  { name:'Razorpay', logo:'R', color:'#0891b2', industry:'Fintech', openRoles:24, rating:4.5 },
  { name:'Sarvam AI', logo:'S', color:'#059669', industry:'AI / NLP', openRoles:12, rating:4.9 },
  { name:'Zepto', logo:'Z', color:'#7c3aed', industry:'Quick Commerce', openRoles:31, rating:4.2 },
  { name:'CRED', logo:'C', color:'#dc2626', industry:'Fintech', openRoles:18, rating:4.4 },
  { name:'Groww', logo:'G', color:'#16a34a', industry:'WealthTech', openRoles:15, rating:4.3 },
];

export const CANDIDATES = [
  {
    id:'c1', name:'Priya Sharma', title:'Senior ML Engineer', company:'Microsoft Research',
    location:'Bengaluru', experience:'6 years', education:'M.Tech · IIT Bombay · 2019',
    skills:['Python','PyTorch','LLMs','RLHF','AWS','MLOps'], initials:'PS', color:'var(--brand-primary)',
    expectedSalary:'₹65L', rating:4.7,
    about:'Experienced ML engineer specialising in LLMs and RLHF. Previously at Google Brain leading fine-tuning pipelines for PaLM. 2 NeurIPS papers. Passionate about AI safety and model interpretability.',
    cvSummary:`PRIYA SHARMA  |  priya.sharma@email.com  |  +91-98765-43210\n${'─'.repeat(52)}\nEXPERIENCE\n  Microsoft Research India  · Senior ML Engineer  · 2022–Present\n    · Led multilingual RLHF pipeline (30+ languages)\n    · Reduced training cost 40% via gradient optimisation\n    · 2 papers at NeurIPS 2023\n  Google Brain  · ML Engineer  · 2019–2022\n    · Distributed training for PaLM (540B params)\n    · Evaluation harnesses for reasoning benchmarks\nEDUCATION\n  IIT Bombay   M.Tech CS   2017–2019   CGPA 9.2\n  IIT Roorkee  B.Tech CS   2013–2017   CGPA 8.9\nSKILLS\n  Python · PyTorch · JAX · RLHF · Distributed Training · MLOps · AWS`,
    peerRatings:[
      { id:'pr1', reviewer:'Amit Gupta', role:'Principal Researcher', company:'Microsoft Research', type:'Manager', stars:5, review:"Best ML engineer I've worked with in 15 years. Exceptional ability to translate research into production. Consistently delivers beyond expectations.", verified:true },
      { id:'pr2', reviewer:'Sneha Krishnan', role:'ML Engineer', company:'Google Brain', type:'Colleague', stars:5, review:'Collaborative, brilliant, thorough. Code always well-documented, always willing to help others. A true team player.', verified:true },
      { id:'pr3', reviewer:'Rohit Menon', role:'Research Scientist', company:'Google Brain', type:'Cross-functional', stars:4, review:'Strong technical skills and great communication. Could be more proactive with status updates, but output quality is always outstanding.', verified:true },
    ],
    interviewScore:null, interviewRounds:[], appliedJobs:['j1'],
  },
  {
    id:'c2', name:'Arjun Mehta', title:'Product Manager', company:'Flipkart',
    location:'Bengaluru', experience:'5 years', education:'MBA · IIM Ahmedabad · 2020',
    skills:['Product Strategy','SQL','A/B Testing','Agile','Figma'], initials:'AM', color:'#f59e0b',
    expectedSalary:'₹48L', rating:4.3,
    about:'PM with 5 years building consumer products at scale. Owns search and discovery for 400M+ Flipkart users. Data-driven with strong product intuition.',
    cvSummary:`ARJUN MEHTA  |  arjun.mehta@email.com  |  +91-98765-43211\n${'─'.repeat(52)}\nEXPERIENCE\n  Flipkart  · Senior PM – Search  · 2021–Present\n    · +23% search-to-purchase conversion via ML ranking\n    · Voice search in 6 languages, 8M MAU in 6 months\n  Swiggy  · PM – Discovery  · 2020–2021\n    · Personalised restaurant reco; +15% order frequency\nEDUCATION\n  IIM Ahmedabad  MBA Strategy & Marketing  2018–2020\n  BITS Pilani    B.E. Computer Science     2014–2018  GPA 8.7\nSKILLS\n  Product Strategy · SQL · A/B Testing · Figma · JIRA · Python (basic)`,
    peerRatings:[
      { id:'pr4', reviewer:'Kavitha Nair', role:'VP Product', company:'Flipkart', type:'Manager', stars:4, review:'Strong PM who understands user needs deeply. Drives projects with clarity. Would benefit from deeper technical intuition but a very solid performer overall.', verified:true },
      { id:'pr5', reviewer:'Dev Patel', role:'Eng Manager', company:'Flipkart', type:'Cross-functional', stars:5, review:"Best PM I've worked with. Specs requirements precisely, always available, makes decisions confidently. Makes engineers' lives much easier.", verified:true },
    ],
    interviewScore:82, interviewRounds:[
      { round:1, name:'Behavioural', score:85, summary:'Strong communication and leadership examples. Well-structured STAR responses.' },
      { round:2, name:'Technical', score:78, summary:'Good SQL and metrics knowledge. Could go deeper on ML concepts.' },
      { round:3, name:'Case Study', score:83, summary:'Excellent prioritisation framework. Clear structured thinking.' },
    ], appliedJobs:['j2'],
  },
  {
    id:'c3', name:'Rahul Verma', title:'Full-stack Engineer', company:'Razorpay',
    location:'Pune', experience:'4 years', education:'B.Tech · VJTI Mumbai · 2021',
    skills:['React','TypeScript','Node.js','PostgreSQL','Docker'], initials:'RV', color:'#10b981',
    expectedSalary:'₹32L', rating:4.1,
    about:'Full-stack engineer building fast, reliable web apps. At Razorpay I own the payments dashboard used by 10M+ merchants. Strong advocate of clean code and developer experience.',
    cvSummary:`RAHUL VERMA  |  rahul.verma@email.com  |  +91-98765-43212\n${'─'.repeat(52)}\nEXPERIENCE\n  Razorpay  · Software Engineer II  · 2022–Present\n    · Real-time payment analytics dashboard (React + D3)\n    · Reduced API latency 35% via query optimisation\n  Juspay  · Junior Engineer  · 2021–2022\n    · Payment gateway integrations for 8 banks\nEDUCATION\n  VJTI Mumbai  B.Tech Computer Engineering  2017–2021  CGPA 8.4\nSKILLS\n  React · TypeScript · Node.js · PostgreSQL · Redis · Docker · AWS`,
    peerRatings:[
      { id:'pr7', reviewer:'Asha Bhat', role:'Engineering Lead', company:'Razorpay', type:'Manager', stars:4, review:'Reliable, clean code, always looking to improve. Took ownership of our dashboard rewrite and delivered on schedule. Good mentoring instincts.', verified:true },
      { id:'pr8', reviewer:'Nikhil Joshi', role:'Senior Engineer', company:'Razorpay', type:'Colleague', stars:4, review:'Solid engineer. Code is readable and well-tested. Communicates clearly during incidents. Would love to see him take on more architectural decisions.', verified:true },
    ],
    interviewScore:null, interviewRounds:[], appliedJobs:['j3'],
  },
  {
    id:'c4', name:'Divya Nair', title:'NLP Research Scientist', company:'Sarvam AI',
    location:'Bengaluru', experience:'3 years', education:'M.Sc. Statistics · IISc · 2022',
    skills:['Python','NLP','Indic Languages','Hugging Face','SQL'], initials:'DN', color:'#ec4899',
    expectedSalary:'₹28L', rating:4.5,
    about:'NLP researcher focused on low-resource Indian languages. Published at ACL 2023 and EMNLP 2023. Passionate about making AI accessible to all 1.4B Indians.',
    cvSummary:`DIVYA NAIR  |  divya.nair@email.com  |  +91-98765-43213\n${'─'.repeat(52)}\nEXPERIENCE\n  Sarvam AI  · Research Scientist  · 2023–Present\n    · Fine-tuned models for 12 Indic languages\n    · 2M+ synthetic language pairs pipeline\n  AI4Bharat  · Research Intern  · 2022\n    · Contributed to IndicBERT v2\nPUBLICATIONS\n  "Cross-lingual Transfer for Dravidian Languages" – ACL 2023\n  "Efficient Fine-tuning for Low-resource NLP" – EMNLP 2023\nEDUCATION\n  IISc Bengaluru  M.Sc. Statistics  2020–2022  GPA 9.1\n  NIT Calicut     B.Tech CSE        2016–2020  GPA 8.8\nSKILLS\n  Python · PyTorch · Hugging Face · NLP · Indic NLP · SQL · FastAPI`,
    peerRatings:[
      { id:'pr9', reviewer:'Dr. Pratyush Kumar', role:'CEO', company:'Sarvam AI', type:'Manager', stars:5, review:'Exceptional researcher. Her work on cross-lingual transfer directly improved our model performance. Brings both research depth and engineering rigour.', verified:true },
      { id:'pr10', reviewer:'Ananya Iyer', role:'Research Scientist', company:'AI4Bharat', type:'Colleague', stars:4, review:'Brilliant with great attention to detail. Contributions to our evaluation suite were invaluable. Methodical and always backs claims with data.', verified:true },
    ],
    interviewScore:null, interviewRounds:[], appliedJobs:['j4'],
  },
];

export const MOCK_Q = {
  1: [
    'Tell me about a time you led a challenging project under tight deadlines. What was your approach and outcome?',
    'Describe a situation where you strongly disagreed with a team decision. How did you handle it?',
    'What is your proudest professional achievement and why does it stand out?',
    'How do you manage competing priorities when multiple urgent tasks hit at once?',
  ],
  2: [
    'Walk me through your experience with the most complex technical problem you have solved.',
    'How would you design a system that needs to handle 10× its current traffic overnight?',
    'Describe your approach to debugging a production incident affecting thousands of users.',
    'How do you ensure code quality and knowledge transfer in your team?',
  ],
  3: [
    'A critical bug is found the day before a major release. You own the feature. What do you do?',
    'Your team must ship an important feature in 2 weeks but is understaffed by 40%. How do you proceed?',
    'A colleague consistently misses deadlines and it is affecting the team. How do you address this?',
    'The product strategy pivots significantly mid-sprint. How do you adapt and keep the team aligned?',
  ],
};
