import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  BookOpen, Play, Link2, FileText, Headphones, Brain,
  Heart, Moon, Zap, Users, Search, Bookmark, BookmarkCheck,
  ExternalLink, Clock, Star, ChevronDown, ChevronUp,
  Flame, Leaf, Shield, Sun, Filter, X, Volume2,
  ArrowRight, CheckCircle, MessageSquare, Send, Loader2,
  Trophy, Target, TrendingUp, Bell, Download, PinIcon,
  Grid3X3, List, PlayCircle, Mic, Newspaper, Wrench, Link,
  ChevronRight, Award, BarChart3, RefreshCw,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// ─────────────────────────────────────────────────────────────────────────────
//  RESOURCE DATA  (60+ resources)
// ─────────────────────────────────────────────────────────────────────────────
const RESOURCES = [

  // ─── ANXIETY (10) ──────────────────────────────────────────────────────────
  {
    id: "1", title: "Understanding Anxiety: NIH Complete Guide",
    description: "Comprehensive overview of anxiety disorders — causes, physical symptoms, types (GAD, panic, social), and evidence-based treatments.",
    category: "anxiety", type: "article",
    tags: ["anxiety", "cbt", "overview", "science"],
    readTime: "8 min read", rating: 4.8, featured: true,
    url: "https://www.nimh.nih.gov/health/topics/anxiety-disorders",
    source: "NIH — National Institute of Mental Health",
    accent: "#0ea5e9",
  },
  {
    id: "2", title: "4-7-8 Breathing Technique — Dr. Andrew Weil",
    description: "The single most powerful technique for anxiety. Inhale 4s, hold 7s, exhale 8s. Dr. Weil demonstrates exactly how to do it.",
    category: "anxiety", type: "video",
    tags: ["anxiety", "breathing", "quick relief", "popular"],
    readTime: "4 min", rating: 4.9, featured: true,
    url: "https://www.youtube.com/watch?v=gz4G31LGyog",
    source: "YouTube — Dr. Andrew Weil",
    accent: "#ef4444",
  },
  {
    id: "3", title: "How Anxiety Works in the Brain — TED-Ed",
    description: "Animated explainer by TED-Ed showing exactly what happens neurologically during anxiety — amygdala hijack, cortisol, fight-flight-freeze.",
    category: "anxiety", type: "video",
    tags: ["anxiety", "neuroscience", "ted-ed", "popular"],
    readTime: "6 min", rating: 4.9, featured: true,
    url: "https://www.youtube.com/watch?v=ZidGozDhOjg",
    source: "TED-Ed",
    accent: "#ef4444",
  },
  {
    id: "4", title: "Anxiety & Worry CBT Workbook",
    description: "Free clinician-developed worksheets to identify anxiety triggers, challenge automatic thoughts, and build coping plans step by step.",
    category: "anxiety", type: "tool",
    tags: ["anxiety", "cbt", "workbook", "printable"],
    readTime: "30 min activity", rating: 4.7,
    url: "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Anxiety",
    source: "Centre for Clinical Interventions",
    accent: "#f59e0b",
  },
  {
    id: "5", title: "Guided Meditation to Reduce Anxiety — 10 min",
    description: "A 10-minute breathing and body awareness meditation from UCLA Mindful Awareness Research Center. Free, no app needed.",
    category: "anxiety", type: "audio",
    tags: ["anxiety", "meditation", "guided", "free", "popular"],
    readTime: "10 min", rating: 4.8,
    url: "https://www.uclahealth.org/programs/uclamindful/free-guided-meditations/",
    source: "UCLA Mindful — Free Guided Meditations",
    accent: "#10b981",
  },
  {
    id: "6", title: "Understanding Panic Attacks",
    description: "Why panic attacks happen, why they feel life-threatening (but aren't), and the paradoxical technique that stops them faster than anything else.",
    category: "anxiety", type: "article",
    tags: ["anxiety", "panic", "technique"],
    readTime: "7 min read", rating: 4.7,
    url: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/anxiety-and-panic-attacks/panic-attacks/",
    source: "Mind UK",
    accent: "#0ea5e9",
  },
  {
    id: "7", title: "Social Anxiety: Graduated Exposure Therapy Guide",
    description: "Learn to face social fear step-by-step using clinically proven exposure therapy principles — with a customisable fear hierarchy template.",
    category: "anxiety", type: "article",
    tags: ["social anxiety", "exposure therapy", "cbt"],
    readTime: "12 min read", rating: 4.6,
    url: "https://www.anxietycanada.com/learn-about-anxiety/social-anxiety/",
    source: "Anxiety Canada",
    accent: "#0ea5e9",
  },
  {
    id: "8", title: "Therapy in a Nutshell — Anxiety Playlist",
    description: "Emma McAdam's YouTube series on anxiety management. Short, evidence-based, therapist-delivered. 5–10 min per video.",
    category: "anxiety", type: "video",
    tags: ["anxiety", "cbt", "youtube", "popular", "series"],
    readTime: "5–10 min each", rating: 4.9,
    url: "https://www.youtube.com/playlist?list=PL-DP-fXoGlKBgEyBKlQYFLs-RKFD1pTLt",
    source: "YouTube — Therapy in a Nutshell",
    accent: "#ef4444",
  },
  {
    id: "9", title: "DARE — The New Way to End Anxiety",
    description: "Barry McDonagh's DARE response technique: Defuse, Allow, Run Toward, Engage. A fresh approach that stops fighting anxiety and wins.",
    category: "anxiety", type: "audio",
    tags: ["anxiety", "dare", "technique", "popular"],
    readTime: "15 min", rating: 4.8,
    url: "https://www.dareresponse.com/free-audio/",
    source: "DARE Response — Free Audio",
    accent: "#10b981",
  },
  {
    id: "10", title: "Exam Anxiety: Student Survival Guide",
    description: "Evidence-based strategies for university students: pre-exam routines, test-taking techniques, and how to reframe performance anxiety.",
    category: "anxiety", type: "article",
    tags: ["anxiety", "exams", "students", "study"],
    readTime: "8 min read", rating: 4.7,
    url: "https://www.studentminds.org.uk/examstress.html",
    source: "Student Minds UK",
    accent: "#0ea5e9",
  },

  // ─── DEPRESSION (8) ────────────────────────────────────────────────────────
  {
    id: "11", title: "Andrew Solomon: Depression — The Secret We Share",
    description: "30-million-view TED Talk. Andrew Solomon weaves personal story and clinical research into the most watched mental health talk ever recorded.",
    category: "depression", type: "video",
    tags: ["depression", "ted talk", "popular", "must watch"],
    readTime: "30 min", rating: 4.9, featured: true,
    url: "https://www.ted.com/talks/andrew_solomon_depression_the_secret_we_share",
    source: "TED",
    accent: "#ef4444",
  },
  {
    id: "12", title: "Behavioural Activation for Depression — CBT Workbook",
    description: "The gold-standard self-help technique for depression. Schedule rewarding activities to break the withdrawal-depression cycle. Free PDF worksheets.",
    category: "depression", type: "tool",
    tags: ["depression", "cbt", "behavioural activation", "workbook"],
    readTime: "20 min activity", rating: 4.7,
    url: "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Depression",
    source: "Centre for Clinical Interventions",
    accent: "#f59e0b",
  },
  {
    id: "13", title: "This Is Depression — Stanford Medicine Podcast",
    description: "Dr. Leanne Williams explains the neuroscience of depression: why it's not a choice, why it's not 'sadness', and what actually works.",
    category: "depression", type: "audio",
    tags: ["depression", "neuroscience", "podcast", "stanford"],
    readTime: "45 min", rating: 4.8,
    url: "https://stanfordhealthcare.org/stanford-health-care-now/2021/depression.html",
    source: "Stanford Health Care",
    accent: "#10b981",
  },
  {
    id: "14", title: "Ketamine to Treat Depression — 60 Minutes",
    description: "CBS 60 Minutes investigation into ketamine therapy — one of the most dramatic breakthroughs in depression treatment in decades.",
    category: "depression", type: "video",
    tags: ["depression", "treatment", "science", "60 minutes"],
    readTime: "14 min", rating: 4.7,
    url: "https://www.youtube.com/watch?v=81-OM_Py9Zg",
    source: "YouTube — 60 Minutes",
    accent: "#ef4444",
  },
  {
    id: "15", title: "Guided Loving-Kindness Meditation for Depression",
    description: "A 20-minute guided meditation combining body scan and loving-kindness. Clinically shown to reduce mild-moderate depression symptoms.",
    category: "depression", type: "audio",
    tags: ["depression", "meditation", "loving-kindness", "mbsr"],
    readTime: "20 min", rating: 4.6,
    url: "https://www.mindful.org/a-five-step-prescription-for-dealing-with-difficult-emotions/",
    source: "Mindful.org — Free Guided Meditations",
    accent: "#10b981",
  },
  {
    id: "16", title: "Exercise vs Antidepressants — BMJ Meta-Analysis",
    description: "Landmark 2023 study of 1,039 trials: 30 minutes of moderate exercise is as effective as antidepressants for mild-moderate depression.",
    category: "depression", type: "article",
    tags: ["depression", "exercise", "science", "research"],
    readTime: "6 min read", rating: 4.9,
    url: "https://www.bmj.com/content/384/bmj-2023-075847",
    source: "British Medical Journal",
    accent: "#0ea5e9",
  },
  {
    id: "17", title: "What Depression Feels Like — NIH",
    description: "A compassionate first-person and clinical account of depression. Helps sufferers feel seen and helps loved ones understand.",
    category: "depression", type: "article",
    tags: ["depression", "awareness", "empathy", "overview"],
    readTime: "10 min read", rating: 4.8,
    url: "https://www.nimh.nih.gov/health/topics/depression",
    source: "NIH — National Institute of Mental Health",
    accent: "#0ea5e9",
  },
  {
    id: "18", title: "Therapy in a Nutshell — Depression Series",
    description: "Emma McAdam's 15-video playlist covering every aspect of depression from causes to recovery. Therapist-delivered, free, evidence-based.",
    category: "depression", type: "video",
    tags: ["depression", "series", "youtube", "popular"],
    readTime: "5–12 min each", rating: 4.9,
    url: "https://www.youtube.com/playlist?list=PL-DP-fXoGlKBhv_o0NpaqzQI0F2eUeEfU",
    source: "YouTube — Therapy in a Nutshell",
    accent: "#ef4444",
  },

  // ─── STRESS (8) ────────────────────────────────────────────────────────────
  {
    id: "19", title: "The Science of Stress — APA",
    description: "Evidence-based breakdown of what cortisol does, why chronic stress damages health, and which interventions are proven to reduce it.",
    category: "stress", type: "article",
    tags: ["stress", "science", "cortisol", "research"],
    readTime: "9 min read", rating: 4.7, featured: true,
    url: "https://www.apa.org/topics/stress",
    source: "American Psychological Association",
    accent: "#0ea5e9",
  },
  {
    id: "20", title: "How to Make Stress Your Friend — Kelly McGonigal TED",
    description: "14M-view TED Talk. Stanford psychologist shows how believing stress is harmful makes it harmful — and what to do instead.",
    category: "stress", type: "video",
    tags: ["stress", "ted talk", "mindset", "popular", "must watch"],
    readTime: "14 min", rating: 4.9, featured: true,
    url: "https://www.ted.com/talks/kelly_mcgonigal_how_to_make_stress_your_friend",
    source: "TED — Kelly McGonigal",
    accent: "#ef4444",
  },
  {
    id: "21", title: "Box Breathing — 5-Minute Stress Reset",
    description: "Used by Navy SEALs. Inhale 4s, hold 4s, exhale 4s, hold 4s. Activates the parasympathetic nervous system immediately.",
    category: "stress", type: "audio",
    tags: ["stress", "breathing", "quick relief", "popular"],
    readTime: "5 min", rating: 4.8,
    url: "https://www.youtube.com/watch?v=tEmt1Znux58",
    source: "YouTube",
    accent: "#10b981",
  },
  {
    id: "22", title: "Stress Diary — 2-Week Trigger Tracker",
    description: "Log stress levels, physical sensations, triggers, and coping responses. Building self-awareness is the first step to change.",
    category: "stress", type: "tool",
    tags: ["stress", "journaling", "tool", "self-awareness"],
    readTime: "Daily 5 min", rating: 4.5,
    url: "https://www.mindtools.com/pages/article/newTCS_01.htm",
    source: "Mind Tools",
    accent: "#f59e0b",
  },
  {
    id: "23", title: "Workplace Stress — WHO Guidelines",
    description: "WHO's evidence-based recommendations for managing work-related stress, burnout, and creating healthier work habits.",
    category: "stress", type: "article",
    tags: ["stress", "workplace", "burnout", "who"],
    readTime: "11 min read", rating: 4.6,
    url: "https://www.who.int/news-room/fact-sheets/detail/mental-health-at-work",
    source: "World Health Organization",
    accent: "#0ea5e9",
  },
  {
    id: "24", title: "Progressive Muscle Relaxation — 15 min Guided",
    description: "Tense and release each muscle group systematically. One of the most evidence-backed techniques for reducing physical stress.",
    category: "stress", type: "audio",
    tags: ["stress", "pmr", "relaxation", "guided", "popular"],
    readTime: "15 min", rating: 4.8,
    url: "https://www.youtube.com/watch?v=ihO02wUzgkc",
    source: "YouTube — Dartmouth Student Wellness",
    accent: "#10b981",
  },
  {
    id: "25", title: "Huberman Lab: Controlling Stress with the Physiological Sigh",
    description: "Stanford neuroscientist Andrew Huberman on the fastest way to reduce acute stress — a double inhale through the nose then slow exhale.",
    category: "stress", type: "video",
    tags: ["stress", "neuroscience", "technique", "popular", "huberman"],
    readTime: "10 min", rating: 4.9,
    url: "https://www.youtube.com/watch?v=kSZKIupBUuc",
    source: "YouTube — Huberman Lab Clips",
    accent: "#ef4444",
  },
  {
    id: "26", title: "Student Exam Stress Management",
    description: "Practical strategies designed for students: Pomodoro method, active recall, pre-exam routines, dealing with results anxiety.",
    category: "stress", type: "article",
    tags: ["stress", "exams", "students", "study", "productivity"],
    readTime: "7 min read", rating: 4.7,
    url: "https://www.studentminds.org.uk/examstress.html",
    source: "Student Minds UK",
    accent: "#0ea5e9",
  },

  // ─── SLEEP (7) ─────────────────────────────────────────────────────────────
  {
    id: "27", title: "Matthew Walker: Sleep Is Your Superpower — TED",
    description: "19M-view TED Talk. Professor Walker explains why sleep is THE most important thing for brain and body health — and what poor sleep costs you.",
    category: "sleep", type: "video",
    tags: ["sleep", "ted talk", "popular", "must watch", "matthew walker"],
    readTime: "19 min", rating: 4.9, featured: true,
    url: "https://www.ted.com/talks/matt_walker_sleep_is_your_superpower",
    source: "TED — Matthew Walker",
    accent: "#ef4444",
  },
  {
    id: "28", title: "CBT-i: Gold-Standard Insomnia Treatment",
    description: "Cognitive Behavioural Therapy for Insomnia is more effective than sleeping pills with zero side effects. Complete guide to the protocol.",
    category: "sleep", type: "article",
    tags: ["sleep", "insomnia", "cbt-i", "treatment", "evidence"],
    readTime: "13 min read", rating: 4.8,
    url: "https://www.sleepfoundation.org/insomnia/treatment/cognitive-behavioral-therapy-insomnia",
    source: "Sleep Foundation",
    accent: "#0ea5e9",
  },
  {
    id: "29", title: "10-Min Sleep Meditation — Body Scan for Insomnia",
    description: "Progressive relaxation and body scan by The Honest Guys. Widely recommended — most users fall asleep before it ends.",
    category: "sleep", type: "audio",
    tags: ["sleep", "meditation", "body scan", "insomnia", "popular"],
    readTime: "10 min", rating: 4.8,
    url: "https://www.youtube.com/watch?v=1vx8iUvfyCY",
    source: "YouTube — The Honest Guys",
    accent: "#10b981",
  },
  {
    id: "30", title: "Sleep Hygiene Checklist — 20 Points",
    description: "Science-backed 20-point checklist: environment, habits, diet, screen time. Implement over 7 days for measurable improvement.",
    category: "sleep", type: "tool",
    tags: ["sleep", "hygiene", "checklist", "habits"],
    readTime: "7-day plan", rating: 4.6,
    url: "https://www.nhs.uk/every-mind-matters/mental-health-issues/sleep/",
    source: "NHS Every Mind Matters",
    accent: "#f59e0b",
  },
  {
    id: "31", title: "Why We Dream — Animated Explainer",
    description: "TED-Ed explains the neuroscience of dreams — REM cycles, memory consolidation, emotional processing. Clear, visual, 5 minutes.",
    category: "sleep", type: "video",
    tags: ["sleep", "dreams", "neuroscience", "ted-ed"],
    readTime: "5 min", rating: 4.7,
    url: "https://www.youtube.com/watch?v=2W85Dwxx218",
    source: "TED-Ed",
    accent: "#ef4444",
  },
  {
    id: "32", title: "432 Hz Deep Sleep Music — Delta Waves",
    description: "Research-backed binaural beats at delta frequency to help entrain the brain toward deep sleep. No headphones needed.",
    category: "sleep", type: "audio",
    tags: ["sleep", "music", "binaural", "delta", "popular"],
    readTime: "8 hours", rating: 4.7,
    url: "https://www.youtube.com/watch?v=iuFKPBR7jDs",
    source: "YouTube — Healing Frequency Music",
    accent: "#10b981",
  },
  {
    id: "33", title: "Sleep & Mental Health — Sleep Foundation",
    description: "The bidirectional relationship between sleep disorders and mental health conditions: depression, anxiety, PTSD, and ADHD.",
    category: "sleep", type: "article",
    tags: ["sleep", "mental health", "depression", "anxiety", "research"],
    readTime: "10 min read", rating: 4.7,
    url: "https://www.sleepfoundation.org/mental-health",
    source: "Sleep Foundation",
    accent: "#0ea5e9",
  },

  // ─── MINDFULNESS (7) ───────────────────────────────────────────────────────
  {
    id: "34", title: "Mindfulness: How It Changes the Brain — 60 Minutes",
    description: "60 Minutes investigates what happens to the brain after mindfulness training — with brain scans before and after 8-week MBSR programmes.",
    category: "mindfulness", type: "video",
    tags: ["mindfulness", "neuroscience", "popular", "mbsr", "60 minutes"],
    readTime: "13 min", rating: 4.8, featured: true,
    url: "https://www.youtube.com/watch?v=_DPn57gQAhE",
    source: "YouTube — 60 Minutes",
    accent: "#ef4444",
  },
  {
    id: "35", title: "5-Senses Grounding: 5-4-3-2-1 Technique",
    description: "The most effective instant grounding technique for anxiety and dissociation. Interactive worksheet with guidance.",
    category: "mindfulness", type: "tool",
    tags: ["mindfulness", "grounding", "anxiety", "quick relief", "popular"],
    readTime: "5 min tool", rating: 4.8,
    url: "https://www.therapistaid.com/therapy-worksheet/5-senses-worksheet",
    source: "Therapist Aid",
    accent: "#f59e0b",
  },
  {
    id: "36", title: "Jon Kabat-Zinn: Mindfulness for Beginners",
    description: "The founder of MBSR explains mindfulness in plain language. What it is, what it isn't, and how to start a practice from zero.",
    category: "mindfulness", type: "video",
    tags: ["mindfulness", "mbsr", "beginner", "kabat-zinn", "popular"],
    readTime: "45 min", rating: 4.7,
    url: "https://www.youtube.com/watch?v=rSU8ftmmhmw",
    source: "YouTube — Jon Kabat-Zinn",
    accent: "#ef4444",
  },
  {
    id: "37", title: "Headspace Basics — Free Guided Meditations",
    description: "Headspace's 10 beginner sessions completely free. Covers breath awareness, body scan, and working with thoughts.",
    category: "mindfulness", type: "link",
    tags: ["mindfulness", "app", "headspace", "free", "popular"],
    readTime: "10 min/day", rating: 4.9,
    url: "https://www.headspace.com/meditation/meditation-for-beginners",
    source: "Headspace",
    accent: "#059669",
  },
  {
    id: "38", title: "UCLA Free Mindfulness Audio Library",
    description: "UCLA Mindful Awareness Research Center's library of 10 free guided meditations in English and Spanish. Clinically tested.",
    category: "mindfulness", type: "audio",
    tags: ["mindfulness", "guided", "free", "ucla", "authentic"],
    readTime: "5–19 min each", rating: 4.8,
    url: "https://www.uclahealth.org/programs/uclamindful/free-guided-meditations",
    source: "UCLA Mindful Awareness Research Center",
    accent: "#10b981",
  },
  {
    id: "39", title: "7-Day Mindfulness Programme",
    description: "Mindful.org's structured week-long introduction. 10 minutes per day, no prior experience needed, clinically evidence-based.",
    category: "mindfulness", type: "article",
    tags: ["mindfulness", "programme", "beginners", "7-day"],
    readTime: "7-day plan", rating: 4.8,
    url: "https://www.mindful.org/meditation/mindfulness-getting-started/",
    source: "Mindful.org",
    accent: "#0ea5e9",
  },
  {
    id: "40", title: "MBSR Body Scan — Full 45-Min Guided Practice",
    description: "Full-length authentic MBSR body scan as taught in Jon Kabat-Zinn's original 8-week programme. The cornerstone mindfulness practice.",
    category: "mindfulness", type: "audio",
    tags: ["mindfulness", "mbsr", "body scan", "guided", "authentic"],
    readTime: "45 min", rating: 4.9,
    url: "https://www.youtube.com/watch?v=u4gZgnmkXNs",
    source: "YouTube — Jon Kabat-Zinn MBSR",
    accent: "#10b981",
  },

  // ─── SELF-CARE (7) ─────────────────────────────────────────────────────────
  {
    id: "41", title: "Self-Care Wheel: Holistic Assessment Tool",
    description: "The six-dimension self-care wheel covering physical, psychological, emotional, spiritual, professional, and social wellness.",
    category: "selfcare", type: "tool",
    tags: ["self-care", "holistic", "planning", "assessment"],
    readTime: "20 min activity", rating: 4.7, featured: true,
    url: "https://www.therapistaid.com/therapy-worksheet/self-care-assessment",
    source: "Therapist Aid",
    accent: "#f59e0b",
  },
  {
    id: "42", title: "Brené Brown: The Power of Vulnerability — TED",
    description: "30M-view TED Talk. Brené Brown's research on shame, vulnerability, and why allowing yourself to be seen is the foundation of well-being.",
    category: "selfcare", type: "video",
    tags: ["self-care", "vulnerability", "ted talk", "popular", "must watch"],
    readTime: "20 min", rating: 4.9,
    url: "https://www.ted.com/talks/brene_brown_the_power_of_vulnerability",
    source: "TED — Brené Brown",
    accent: "#ef4444",
  },
  {
    id: "43", title: "Exercise & Mental Health: BMJ Research",
    description: "Landmark 2023 meta-analysis: exercise is as effective as antidepressants and therapy for mild-moderate depression and anxiety.",
    category: "selfcare", type: "article",
    tags: ["self-care", "exercise", "research", "evidence"],
    readTime: "8 min read", rating: 4.8,
    url: "https://www.bmj.com/content/384/bmj-2023-075847",
    source: "British Medical Journal",
    accent: "#0ea5e9",
  },
  {
    id: "44", title: "30 Journaling Prompts for Mental Health",
    description: "Evidence-backed journaling reduces anxiety and depression. These 30 structured prompts guide you through gratitude, reflection, and healing.",
    category: "selfcare", type: "tool",
    tags: ["self-care", "journaling", "gratitude", "prompts"],
    readTime: "30-day activity", rating: 4.7,
    url: "https://positivepsychology.com/journaling-for-mental-health/",
    source: "Positive Psychology",
    accent: "#f59e0b",
  },
  {
    id: "45", title: "Digital Detox: Reclaim Your Mind",
    description: "How social media worsens anxiety, depression, and focus — with a practical 7-day digital detox plan that actually works.",
    category: "selfcare", type: "article",
    tags: ["self-care", "digital", "social media", "focus", "habits"],
    readTime: "10 min read", rating: 4.6,
    url: "https://www.apa.org/topics/social-media-internet/technology-use-health",
    source: "American Psychological Association",
    accent: "#0ea5e9",
  },
  {
    id: "46", title: "Yoga with Adriene — Yoga for Mental Health",
    description: "Adriene Mishler's 30-min free yoga session specifically designed for stress, anxiety, and low mood. 12M+ views, no experience needed.",
    category: "selfcare", type: "video",
    tags: ["self-care", "yoga", "exercise", "popular", "youtube"],
    readTime: "30 min", rating: 4.9,
    url: "https://www.youtube.com/watch?v=COp7BR_Dvps",
    source: "YouTube — Yoga with Adriene",
    accent: "#ef4444",
  },
  {
    id: "47", title: "Gratitude Meditation — 10 Minutes",
    description: "Gratitude meditation from the Greater Good Science Center at Berkeley. Clinically studied positive psychology intervention.",
    category: "selfcare", type: "audio",
    tags: ["self-care", "gratitude", "meditation", "positive psychology"],
    readTime: "10 min", rating: 4.7,
    url: "https://www.youtube.com/watch?v=Y8JE14ZQPBA",
    source: "YouTube — Greater Good Science Center",
    accent: "#10b981",
  },

  // ─── CRISIS SUPPORT (6) ────────────────────────────────────────────────────
  {
    id: "48", title: "If You're in Crisis Right Now — What to Do",
    description: "NIH's clear, non-judgmental guide for a mental health crisis. Hotlines, text services, and immediate coping steps.",
    category: "crisis", type: "article",
    tags: ["crisis", "emergency", "hotline", "urgent"],
    readTime: "4 min read", rating: 5.0, featured: true, urgent: true,
    url: "https://www.nimh.nih.gov/health/topics/suicide-prevention",
    source: "NIH — Suicide Prevention",
    accent: "#ef4444",
  },
  {
    id: "49", title: "iCall — Free Counselling Helpline India",
    description: "TISS-run psychosocial helpline. Free professional counselling by phone and email for students. Call: 9152987821 (Mon–Sat 8am–10pm).",
    category: "crisis", type: "link",
    tags: ["crisis", "india", "helpline", "free", "students", "urgent"],
    readTime: "Immediate", rating: 4.9, urgent: true,
    url: "https://icallhelpline.org",
    source: "TISS iCall — Free Helpline",
    accent: "#059669",
  },
  {
    id: "50", title: "Vandrevala Foundation 24/7 Helpline",
    description: "Free 24/7 mental health helpline. Call 1860-2662-345 or text. Covers depression, suicidal thoughts, anxiety, crisis support.",
    category: "crisis", type: "link",
    tags: ["crisis", "india", "24/7", "free", "urgent"],
    readTime: "24/7", rating: 4.9, urgent: true,
    url: "https://www.vandrevalafoundation.com",
    source: "Vandrevala Foundation",
    accent: "#059669",
  },
  {
    id: "51", title: "Safety Planning for Suicidal Thoughts",
    description: "Create a personal safety plan using Stanley-Brown's clinical framework. Having a plan reduces hospitalisation risk by 40%.",
    category: "crisis", type: "tool",
    tags: ["crisis", "safety plan", "suicide prevention", "clinical"],
    readTime: "30 min activity", rating: 4.9, urgent: true,
    url: "https://www.sprc.org/resources-programs/stanley-brown-safety-planning-intervention",
    source: "Suicide Prevention Resource Center",
    accent: "#f59e0b",
  },
  {
    id: "52", title: "How to Talk to Someone Who Is Suicidal",
    description: "A practical, evidence-based guide on what to say and what NOT to say when someone you know is in crisis. For friends, family, classmates.",
    category: "crisis", type: "article",
    tags: ["crisis", "support", "help others", "communication"],
    readTime: "8 min read", rating: 4.9,
    url: "https://www.helpguide.org/articles/suicide-prevention/suicide-prevention.htm",
    source: "HelpGuide.org",
    accent: "#0ea5e9",
  },
  {
    id: "53", title: "iCall — Online Chat Counselling (Free)",
    description: "TISS iCall's free online text-based counselling for those who prefer not to call. Available during working hours for Indian students.",
    category: "crisis", type: "link",
    tags: ["crisis", "india", "free", "chat", "students", "urgent"],
    readTime: "Immediate", rating: 4.8, urgent: true,
    url: "https://icallhelpline.org/chat-counselling/",
    source: "TISS iCall — Online Chat",
    accent: "#059669",
  },

  // ─── FOR COUNSELLORS (6) ───────────────────────────────────────────────────
  {
    id: "54", title: "Motivational Interviewing — Complete Guide",
    description: "MINT's comprehensive guide to MI: OARS skills, change talk, ambivalence, rolling with resistance. With practice exercises.",
    category: "counsellors", type: "article",
    tags: ["counsellors", "mi", "technique", "professional"],
    readTime: "15 min read", rating: 4.8, featured: true,
    url: "https://motivationalinterviewing.org/understanding-motivational-interviewing",
    source: "MINT — Motivational Interviewing Network",
    accent: "#0ea5e9",
  },
  {
    id: "55", title: "SAMHSA Trauma-Informed Care Principles",
    description: "SAMHSA's 6 principles of trauma-informed care with practical implementation guidance for counsellors working with trauma survivors.",
    category: "counsellors", type: "article",
    tags: ["counsellors", "trauma", "trauma-informed", "samhsa"],
    readTime: "18 min read", rating: 4.9,
    url: "https://www.samhsa.gov/nctic/trauma-interventions",
    source: "SAMHSA",
    accent: "#0ea5e9",
  },
  {
    id: "56", title: "APA Clinical Practice Guidelines",
    description: "American Psychological Association's full library of clinical practice guidelines. Evidence-based, freely accessible to practitioners.",
    category: "counsellors", type: "link",
    tags: ["counsellors", "apa", "guidelines", "clinical", "reference"],
    readTime: "Reference", rating: 4.8,
    url: "https://www.apa.org/practice/guidelines",
    source: "American Psychological Association",
    accent: "#059669",
  },
  {
    id: "57", title: "Counsellor Self-Care: Preventing Compassion Fatigue",
    description: "Evidence-based strategies for mental health professionals to prevent vicarious trauma, compassion fatigue, and burnout.",
    category: "counsellors", type: "article",
    tags: ["counsellors", "self-care", "burnout", "compassion fatigue"],
    readTime: "12 min read", rating: 4.7,
    url: "https://positivepsychology.com/compassion-fatigue/",
    source: "Positive Psychology",
    accent: "#0ea5e9",
  },
  {
    id: "58", title: "Therapist Aid — Free Clinical Worksheets",
    description: "Over 200 free evidence-based worksheets for therapists covering CBT, DBT, ACT, trauma, relationships, and more.",
    category: "counsellors", type: "link",
    tags: ["counsellors", "worksheets", "cbt", "dbt", "free", "clinical"],
    readTime: "Reference", rating: 4.9,
    url: "https://www.therapistaid.com",
    source: "Therapist Aid",
    accent: "#059669",
  },
  {
    id: "59", title: "Beck Institute — CBT Training Resources",
    description: "Free CBT training materials, videos, and case formulations from the Beck Institute — the founding institution of cognitive therapy.",
    category: "counsellors", type: "link",
    tags: ["counsellors", "cbt", "beck", "training", "professional"],
    readTime: "Reference", rating: 4.8,
    url: "https://beckinstitute.org/get-informed/",
    source: "Beck Institute for CBT",
    accent: "#059669",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  CATEGORIES + TYPES config
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",         label: "All",            icon: BookOpen,  color: "#059669", bg: "#ecfdf5" },
  { id: "anxiety",     label: "Anxiety",        icon: Brain,     color: "#0ea5e9", bg: "#f0f9ff" },
  { id: "depression",  label: "Depression",     icon: Heart,     color: "#059669", bg: "#ecfdf5" },
  { id: "stress",      label: "Stress",         icon: Flame,     color: "#f59e0b", bg: "#fffbeb" },
  { id: "sleep",       label: "Sleep",          icon: Moon,      color: "#0d9488", bg: "#f0fdfa" },
  { id: "mindfulness", label: "Mindfulness",    icon: Leaf,      color: "#10b981", bg: "#ecfdf5" },
  { id: "selfcare",    label: "Self-Care",      icon: Sun,       color: "#ec4899", bg: "#fdf2f8" },
  { id: "crisis",      label: "Crisis Support", icon: Shield,    color: "#ef4444", bg: "#fef2f2" },
  { id: "counsellors", label: "For Counsellors",icon: Users,     color: "#f59e0b", bg: "#fffbeb" },
];

// Type designs — each with distinct icon, colour, bg, label
const TYPE_META = {
  article: { icon: Newspaper,  label: "Article",  color: "#059669", bg: "#ecfdf5", iconBg: "#34d399" },
  video:   { icon: PlayCircle, label: "Video",    color: "#ef4444", bg: "#fef2f2", iconBg: "#f87171" },
  audio:   { icon: Headphones, label: "Audio",    color: "#10b981", bg: "#ecfdf5", iconBg: "#34d399" },
  tool:    { icon: Wrench,     label: "Tool",     color: "#f59e0b", bg: "#fffbeb", iconBg: "#fbbf24" },
  link:    { icon: Link,       label: "Link",     color: "#0ea5e9", bg: "#f0f9ff", iconBg: "#38bdf8" },
};

const HOTLINES = [
  { name: "Emergency",      number: "112",          note: "Police / Ambulance",    color: "#ef4444" },
  { name: "iCall (TISS)",   number: "9152987821",   note: "Mon–Sat 8am–10pm",     color: "#059669" },
  { name: "Vandrevala",     number: "1860-2662-345",note: "24/7 Free",             color: "#0ea5e9" },
  { name: "NIMHANS",        number: "080-46110007", note: "Bangalore",             color: "#10b981" },
  { name: "Snehi",          number: "044-24640050", note: "Emotional support",     color: "#f59e0b" },
];

const SECTION_TABS = ["All", "Videos", "Articles", "Audios", "Tools", "Links"];

const FEATURED = RESOURCES.filter(r => r.featured).slice(0, 6);

// ─────────────────────────────────────────────────────────────────────────────
//  STAR RATING COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 16 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange && onChange(s)}>
          <Star size={size} className={`transition-colors ${
            s <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-gray-300"
          } ${onChange ? "cursor-pointer" : "cursor-default"}`} />
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  RESOURCE CARD
// ─────────────────────────────────────────────────────────────────────────────
function ResourceCard({ resource, userData, onToggleBookmark, onToggleComplete, onRate, token }) {
  const [expanded,        setExpanded]        = useState(false);
  const [showRatePanel,   setShowRatePanel]   = useState(false);
  const [myRating,        setMyRating]        = useState(userData?.ratings?.[resource.id]?.rating || 0);
  const [myComment,       setMyComment]       = useState(userData?.ratings?.[resource.id]?.comment || "");
  const [submittingRate,  setSubmittingRate]  = useState(false);
  const [publicRatings,   setPublicRatings]   = useState(null);
  const [loadingPublic,   setLoadingPublic]   = useState(false);

  const type      = TYPE_META[resource.type];
  const TypeIcon  = type.icon;
  const saved     = userData?.bookmarks?.some(b => b.resourceId === resource.id);
  const completed = userData?.completedIds?.includes(resource.id);
  const myExist   = userData?.ratings?.[resource.id];

  const loadPublicRatings = async () => {
    if (publicRatings) return;
    setLoadingPublic(true);
    try {
      const res  = await fetch(`${API}/resources/${resource.id}/ratings`);
      const data = await res.json();
      if (data.success) setPublicRatings(data.data);
    } catch (e) { /* silent */ }
    finally { setLoadingPublic(false); }
  };

  const handleRateSubmit = async () => {
    if (!myRating) return;
    setSubmittingRate(true);
    try {
      const res  = await fetch(`${API}/resources/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ resourceId: resource.id, rating: myRating, comment: myComment }),
      });
      const data = await res.json();
      if (data.success) {
        onRate(resource.id, myRating, myComment);
        setShowRatePanel(false);
        setPublicRatings(null); // refresh
      }
    } catch (e) { /* silent */ }
    finally { setSubmittingRate(false); }
  };

  const displayRating = myExist?.rating || resource.rating;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg flex flex-col ${
      resource.urgent ? "border-red-200 ring-1 ring-red-300" : "border-gray-200"
    }`}>
      {/* Type indicator bar — unique per type */}
      <div className="h-1.5 w-full" style={{ background: type.color }} />

      {/* Type icon strip */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: type.bg }}>
          <TypeIcon size={15} style={{ color: type.color }} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: type.color }}>
          {type.label}
        </span>
        {resource.urgent && (
          <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🚨 Urgent</span>
        )}
        {!resource.urgent && resource.featured && (
          <span className="ml-auto text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⭐ Featured</span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-3 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:underline">
          {resource.title}
        </h3>
        <p className={`text-xs text-gray-500 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
          {resource.description}
        </p>
        {resource.description.length > 80 && (
          <button onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-0.5 text-[11px] font-medium mt-1"
            style={{ color: type.color }}>
            {expanded ? <><ChevronUp size={11}/> Less</> : <><ChevronDown size={11}/> More</>}
          </button>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {resource.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
              #{tag}
            </span>
          ))}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
          <span className="flex items-center gap-0.5"><Clock size={10}/> {resource.readTime}</span>
          {displayRating > 0 && (
            <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
              <Star size={10} className="fill-amber-400"/> {displayRating}
            </span>
          )}
          <span className="truncate ml-auto text-gray-300 max-w-[120px]">{resource.source}</span>
        </div>

        <div className="mt-auto" />

        {/* Rate panel */}
        {showRatePanel && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Your rating</p>
            <StarRating value={myRating} onChange={setMyRating} size={18} />
            <textarea value={myComment} onChange={e => setMyComment(e.target.value)}
              placeholder="Leave a comment (optional)…" rows={2}
              className="w-full mt-2 px-2 py-1.5 border border-gray-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-1 focus:ring-emerald-300" />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowRatePanel(false)} className="flex-1 py-1 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50">Cancel</button>
              <button onClick={handleRateSubmit} disabled={!myRating || submittingRate}
                className="flex-1 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-1"
                style={{ background: type.color }}>
                {submittingRate ? <Loader2 size={11} className="animate-spin"/> : <Send size={11}/>}
                Submit
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-3 pb-3 border-t border-gray-100 mt-3">
          {/* Open resource */}
          <a href={resource.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg flex-1 justify-center transition-all"
            style={{ background: type.bg, color: type.color }}>
            {resource.type === "video" ? "Watch" : resource.type === "audio" ? "Listen" : resource.type === "tool" ? "Open" : "Read"}
            <ExternalLink size={10}/>
          </a>
          {/* Complete */}
          {token && (
            <button onClick={() => onToggleComplete(resource.id, !completed)} title={completed ? "Mark incomplete" : "Mark complete"}
              className={`p-1.5 rounded-lg transition-colors ${completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400 hover:text-green-500"}`}>
              <CheckCircle size={14}/>
            </button>
          )}
          {/* Bookmark */}
          {token && (
            <button onClick={() => onToggleBookmark(resource.id)} title={saved ? "Remove bookmark" : "Save"}
              className={`p-1.5 rounded-lg transition-colors ${saved ? "bg-emerald-100 text-emerald-500" : "bg-gray-100 text-gray-400 hover:text-emerald-500"}`}>
              {saved ? <BookmarkCheck size={14}/> : <Bookmark size={14}/>}
            </button>
          )}
          {/* Rate */}
          {token && (
            <button onClick={() => { setShowRatePanel(p => !p); loadPublicRatings(); }} title="Rate this resource"
              className={`p-1.5 rounded-lg transition-colors ${myExist ? "bg-amber-100 text-amber-500" : "bg-gray-100 text-gray-400 hover:text-amber-400"}`}>
              <Star size={14} className={myExist ? "fill-amber-400" : ""}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FEATURED HERO CARD
// ─────────────────────────────────────────────────────────────────────────────
function FeaturedCard({ resource, saved, completed, onToggleBookmark }) {
  const type     = TYPE_META[resource.type];
  const TypeIcon = type.icon;
  return (
    <a href={resource.url} target="_blank" rel="noopener noreferrer"
      className="relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all group flex flex-col">
      {/* Header gradient */}
      <div className="h-24 flex items-end p-4 relative"
        style={{ background: `linear-gradient(135deg, ${resource.accent}dd, ${resource.accent}99)` }}>
        <div className="absolute top-3 left-3 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <TypeIcon size={16} className="text-white" />
        </div>
        {completed && (
          <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle size={12} className="text-white fill-white" />
          </div>
        )}
        <div>
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{type.label}</span>
          <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 group-hover:underline">
            {resource.title}
          </h3>
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <p className="text-xs text-gray-500 line-clamp-2 flex-1">{resource.description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-gray-400 flex items-center gap-0.5"><Clock size={10}/> {resource.readTime}</span>
          {resource.rating && (
            <span className="text-[11px] font-bold text-amber-500 flex items-center gap-0.5">
              <Star size={10} className="fill-amber-400"/> {resource.rating}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  RECOMMENDATION BADGE (shown to students)
// ─────────────────────────────────────────────────────────────────────────────
function RecommendedBadge({ rec }) {
  return (
    <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
      <div className="w-7 h-7 rounded-full bg-emerald-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
        {rec.counsellor?.avatar
          ? <img src={rec.counsellor.avatar} alt={rec.counsellor.fullName} className="w-full h-full object-cover"/>
          : <span className="text-xs font-bold text-emerald-700">{(rec.counsellor?.fullName||"C")[0]}</span>
        }
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-emerald-800">
          📌 Recommended by {rec.counsellor?.fullName}
        </p>
        {rec.note && <p className="text-[11px] text-emerald-600 italic">"{rec.note}"</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  RECOMMEND MODAL (counsellor → student)
// ─────────────────────────────────────────────────────────────────────────────
function RecommendModal({ resourceId, token, onClose }) {
  const [studentSearch, setStudentSearch] = useState("");
  const [students,      setStudents]      = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [note,          setNote]          = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [done,          setDone]          = useState(false);

  useEffect(() => {
    if (studentSearch.length < 2) { setStudents([]); return; }
    const t = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/admin/users?role=student&search=${encodeURIComponent(studentSearch)}&limit=8`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setStudents(data.data.users || []);
      } catch (e) { /* silent */ }
    }, 350);
    return () => clearTimeout(t);
  }, [studentSearch, token]);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/resources/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ studentId: selected._id, resourceId, note }),
      });
      const data = await res.json();
      if (data.success) setDone(true);
    } catch (e) { /* silent */ }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Recommendation Sent!</h3>
            <p className="text-sm text-gray-500 mb-4">The student has been notified via email.</p>
            <button onClick={onClose} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Recommend to Student</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input type="text" value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                placeholder="Search student name or email…"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"/>
            </div>
            {students.length > 0 && !selected && (
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-3 max-h-48 overflow-y-auto">
                {students.map(s => (
                  <button key={s._id} onClick={() => { setSelected(s); setStudents([]); setStudentSearch(s.fullName); }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-left">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                      {(s.fullName||"S")[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.fullName}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selected && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">{selected.fullName[0]}</div>
                <p className="text-sm font-semibold text-emerald-800">{selected.fullName}</p>
                <button onClick={() => { setSelected(null); setStudentSearch(""); }} className="ml-auto text-emerald-400 hover:text-emerald-600"><X size={14}/></button>
              </div>
            )}
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add a note for the student (optional)…" rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 mb-4"/>
            <button onClick={handleSubmit} disabled={!selected || submitting}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
              Send Recommendation
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function Resources() {
  const { user, token } = useAuth();
  const isCounsellor = user?.role === "counsellor";
  const isAdmin      = user?.role === "admin";

  // ── User data from DB ─────────────────────────────────────────────────────
  const [userData,    setUserData]    = useState({ bookmarks: [], completedIds: [], recommendations: [], ratings: {} });
  const [dataLoading, setDataLoading] = useState(false);

  const fetchUserData = useCallback(async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const res  = await fetch(`${API}/resources/my-data`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setUserData(data.data);
    } catch (e) { /* silent */ }
    finally { setDataLoading(false); }
  }, [token]);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSection,  setActiveSection]  = useState("All");
  const [search,         setSearch]         = useState("");
  const [searchInput,    setSearchInput]    = useState("");
  const [showSaved,      setShowSaved]      = useState(false);
  const [showCompleted,  setShowCompleted]  = useState(false);
  const [recommendModal, setRecommendModal] = useState(null); // resourceId

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Filter logic
  const filtered = useMemo(() => {
    const typeMap = { Videos: "video", Articles: "article", Audios: "audio", Tools: "tool", Links: "link" };
    const typeFilter = typeMap[activeSection];

    return RESOURCES.filter(r => {
      if (isCounsellor === false && isAdmin === false && r.category === "counsellors") return false;
      if (showSaved     && !userData.bookmarks.some(b => b.resourceId === r.id))  return false;
      if (showCompleted && !userData.completedIds.includes(r.id))                  return false;
      if (activeCategory !== "all" && r.category !== activeCategory)               return false;
      if (typeFilter     && r.type !== typeFilter)                                  return false;
      if (search) {
        const q = search.toLowerCase();
        return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.some(t => t.includes(q));
      }
      return true;
    });
  }, [activeCategory, activeSection, search, showSaved, showCompleted, userData, isCounsellor, isAdmin]);

  // ── Progress stats ────────────────────────────────────────────────────────
  const completedCount = userData.completedIds.length;
  const totalCount     = RESOURCES.length;
  const progressPct    = Math.round((completedCount / totalCount) * 100);

  // ── Actions (optimistic UI) ───────────────────────────────────────────────
  const handleToggleBookmark = async (resourceId) => {
    const saved = userData.bookmarks.some(b => b.resourceId === resourceId);
    // Optimistic
    setUserData(prev => ({
      ...prev,
      bookmarks: saved
        ? prev.bookmarks.filter(b => b.resourceId !== resourceId)
        : [...prev.bookmarks, { resourceId, savedAt: new Date() }],
    }));
    try {
      await fetch(`${API}/resources/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ resourceId }),
      });
    } catch (e) { fetchUserData(); } // revert on error
  };

  const handleToggleComplete = async (resourceId, completed) => {
    setUserData(prev => ({
      ...prev,
      completedIds: completed
        ? [...prev.completedIds, resourceId]
        : prev.completedIds.filter(id => id !== resourceId),
    }));
    try {
      await fetch(`${API}/resources/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ resourceId, completed }),
      });
    } catch (e) { fetchUserData(); }
  };

  const handleRate = (resourceId, rating, comment) => {
    setUserData(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [resourceId]: { rating, comment } },
    }));
  };

  // Recommendations for student
  const recommendations = userData.recommendations || [];
  const pendingRecs = recommendations.filter(r => !r.read);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO ── */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-500 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={18} className="opacity-70"/>
                <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Resource Hub</span>
              </div>
              <h1 className="text-4xl font-extrabold leading-tight">
                Mental Health<br/><span className="text-yellow-300">Library</span>
              </h1>
              <p className="mt-2 text-white/70 max-w-md text-sm">
                {RESOURCES.length} curated resources — articles, videos, guided audio, and tools — selected by mental health professionals.
              </p>
            </div>

            {/* Progress tracker */}
            {token && (
              <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-4 min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={16} className="text-yellow-300"/>
                  <span className="text-xs font-semibold opacity-80">Your Progress</span>
                </div>
                <p className="text-3xl font-black">{progressPct}%</p>
                <p className="text-xs opacity-60 mb-2">{completedCount} / {totalCount} completed</p>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-300 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}/>
                </div>
                {userData.bookmarks.length > 0 && (
                  <p className="text-xs opacity-60 mt-2">🔖 {userData.bookmarks.length} saved</p>
                )}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50"/>
            <input type="text" placeholder="Search articles, videos, tools, topics…"
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white/20 border border-white/25 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"/>
            {searchInput && (
              <button onClick={() => { setSearchInput(""); setSearch(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                <X size={14}/>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Crisis banner ── */}
      <div className="bg-red-50 border-b border-red-200">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-red-700 flex items-center gap-1"><Shield size={13}/> Crisis Help:</span>
            {HOTLINES.slice(0, 3).map(h => (
              <a key={h.name} href={`tel:${h.number.replace(/[-\s]/g,"")}`}
                className="text-xs font-bold px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity"
                style={{ background: h.color + "20", color: h.color }}>
                {h.name}: {h.number}
              </a>
            ))}
          </div>
          <button onClick={() => { setActiveCategory("crisis"); setActiveSection("All"); }}
            className="text-xs text-red-600 font-semibold flex items-center gap-1 hover:text-red-800">
            All resources <ChevronRight size={12}/>
          </button>
        </div>
      </div>

      {/* ── Counsellor recommendations (student-only) ── */}
      {!isCounsellor && !isAdmin && recommendations.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <PinIcon size={15} className="text-emerald-600"/>
              <h2 className="font-bold text-emerald-900 text-sm">
                Resources Recommended by Your Counsellor
                {pendingRecs.length > 0 && <span className="ml-2 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">{pendingRecs.length} new</span>}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendations.slice(0, 4).map(rec => {
                const res = RESOURCES.find(r => r.id === rec.resourceId);
                if (!res) return null;
                const type = TYPE_META[res.type];
                const TypeIcon = type.icon;
                return (
                  <div key={rec.id} className="bg-white border border-emerald-200 rounded-xl p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: type.bg }}>
                      <TypeIcon size={14} style={{ color: type.color }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{res.title}</p>
                      <p className="text-[11px] text-emerald-600">From: {rec.counsellor?.fullName}</p>
                      {rec.note && <p className="text-[11px] text-gray-400 italic truncate">"{rec.note}"</p>}
                    </div>
                    <a href={res.url} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ background: type.bg, color: type.color }}>
                      Open
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── FEATURED PICKS ── */}
        {activeCategory === "all" && activeSection === "All" && !search && !showSaved && !showCompleted && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={16} className="text-amber-500"/>
              <h2 className="text-base font-bold text-gray-900">Featured Picks</h2>
              <span className="text-xs text-gray-400 ml-1">Most popular & impactful</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {FEATURED.map(r => (
                <FeaturedCard key={r.id} resource={r}
                  saved={userData.bookmarks.some(b => b.resourceId === r.id)}
                  completed={userData.completedIds.includes(r.id)}
                  onToggleBookmark={handleToggleBookmark} />
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION TABS (by type) ── */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {SECTION_TABS.map(tab => {
            const icons = { All: Grid3X3, Videos: PlayCircle, Articles: Newspaper, Audios: Headphones, Tools: Wrench, Links: Link };
            const Icon = icons[tab];
            const colors = { All: "#059669", Videos: "#ef4444", Articles: "#0ea5e9", Audios: "#10b981", Tools: "#f59e0b", Links: "#047857" };
            const active = activeSection === tab;
            return (
              <button key={tab} onClick={() => setActiveSection(tab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  active ? "border-transparent text-white shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
                style={active ? { background: colors[tab] } : {}}>
                <Icon size={13}/> {tab}
                {tab !== "All" && (
                  <span className="text-[10px] opacity-70">
                    ({RESOURCES.filter(r => r.type === tab.slice(0,-1).toLowerCase()).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── CATEGORY PILLS ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORIES
            .filter(c => isCounsellor || isAdmin ? true : c.id !== "counsellors")
            .map(cat => {
              const CatIcon = cat.icon;
              const count   = RESOURCES.filter(r => cat.id === "all" ? true : r.category === cat.id).length;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap ${
                    activeCategory === cat.id ? "border-transparent text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                  style={activeCategory === cat.id ? { background: cat.color } : {}}>
                  <CatIcon size={11}/> {cat.label}
                  <span className="opacity-60 text-[10px]">({count})</span>
                </button>
              );
            })}
        </div>

        {/* ── FILTER ROW ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900">
              {search ? `"${search}"` : showSaved ? "Saved" : showCompleted ? "Completed" :
               activeCategory !== "all" ? CATEGORIES.find(c=>c.id===activeCategory)?.label : "All Resources"}
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {token && (
              <>
                <button onClick={() => { setShowSaved(s => !s); setShowCompleted(false); }}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                    showSaved ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}>
                  <Bookmark size={11}/> Saved ({userData.bookmarks.length})
                </button>
                <button onClick={() => { setShowCompleted(c => !c); setShowSaved(false); }}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                    showCompleted ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}>
                  <CheckCircle size={11}/> Done ({completedCount})
                </button>
              </>
            )}
            {(search || activeCategory !== "all" || activeSection !== "All" || showSaved || showCompleted) && (
              <button onClick={() => { setSearch(""); setSearchInput(""); setActiveCategory("all"); setActiveSection("All"); setShowSaved(false); setShowCompleted(false); }}
                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                <X size={12}/> Clear
              </button>
            )}
          </div>
        </div>

        {/* ── TYPE LEGEND ── */}
        <div className="flex flex-wrap gap-3 mb-5">
          {Object.entries(TYPE_META).map(([key, t]) => {
            const TIcon = t.icon;
            return (
              <div key={key} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: t.bg }}>
                  <TIcon size={11} style={{ color: t.color }}/>
                </div>
                {t.label}
              </div>
            );
          })}
          <span className="text-[11px] text-gray-400 ml-1">• Tap the icon to identify content type</span>
        </div>

        {/* ── RESOURCE GRID ── */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <BookOpen size={36} className="mx-auto mb-3 text-gray-200"/>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {showSaved ? "No saved resources yet" : showCompleted ? "No completed resources" : "No results"}
            </h3>
            <p className="text-gray-400 text-sm">
              {showSaved ? "Bookmark resources to access them quickly later." : "Try different filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(r => (
              <div key={r.id} className="flex flex-col">
                {/* Counsellor recommend button */}
                {(isCounsellor || isAdmin) && (
                  <button onClick={() => setRecommendModal(r.id)}
                    className="flex items-center gap-1 text-[11px] text-emerald-500 hover:text-emerald-700 mb-1 font-medium">
                    <PinIcon size={10}/> Recommend to student
                  </button>
                )}
                <ResourceCard resource={r} userData={userData} token={token}
                  onToggleBookmark={handleToggleBookmark}
                  onToggleComplete={handleToggleComplete}
                  onRate={handleRate} />
              </div>
            ))}
          </div>
        )}

        {/* ── CRISIS HOTLINES ── */}
        {(activeCategory === "all" || activeCategory === "crisis") && !search && (
          <section className="mt-14">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={15} className="text-red-500"/>
              <h2 className="text-base font-bold text-gray-900">Crisis Helplines — India</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {HOTLINES.map(h => (
                <a key={h.name} href={`tel:${h.number.replace(/[-\s]/g,"")}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: h.color + "15" }}>
                    <Volume2 size={15} style={{ color: h.color }}/>
                  </div>
                  <p className="font-bold text-gray-900 text-sm group-hover:underline">{h.name}</p>
                  <p className="font-black text-base mt-0.5" style={{ color: h.color }}>{h.number}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{h.note}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── COUNSELLOR CORNER ── */}
        {(isCounsellor || isAdmin) && (activeCategory === "all" || activeCategory === "counsellors") && !search && (
          <section className="mt-10">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Users size={18} className="text-amber-600"/>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Professional Development Corner</h2>
                  <p className="text-xs text-gray-500">Quick links for MindCare counsellors</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { e: "📚", t: "APA Practice Guidelines",       d: "All APA clinical guidelines, free",       u: "https://www.apa.org/practice/guidelines"            },
                  { e: "🧠", t: "Beck Institute CBT Resources",  d: "Training materials & case formulations",   u: "https://beckinstitute.org/get-informed/"            },
                  { e: "💬", t: "Motivational Interviewing",     d: "MINT training videos & resources",         u: "https://motivationalinterviewing.org"               },
                  { e: "📋", t: "Therapist Aid Worksheets",      d: "200+ free evidence-based worksheets",      u: "https://www.therapistaid.com"                       },
                  { e: "🎓", t: "SAMHSA Trauma-Informed Care",  d: "6 principles + implementation guide",      u: "https://www.samhsa.gov/nctic/trauma-interventions"  },
                  { e: "🔬", t: "Positive Psychology Tools",    d: "Scales, assessments & intervention guides",u: "https://positivepsychology.com/positive-psychology-tools/" },
                ].map(item => (
                  <a key={item.t} href={item.u} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white border border-amber-200 rounded-xl p-3.5 hover:shadow-sm transition group">
                    <span className="text-2xl">{item.e}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-amber-700">{item.t}</p>
                      <p className="text-xs text-gray-400">{item.d}</p>
                    </div>
                    <ExternalLink size={12} className="text-gray-300 group-hover:text-amber-500 transition flex-shrink-0"/>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── STATS ── */}
        {activeCategory === "all" && !search && !showSaved && !showCompleted && activeSection === "All" && (
          <section className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { stat: "1 in 4",  desc: "people will experience a mental health problem this year",         icon: Brain,  color: "#059669" },
              { stat: "79%",     desc: "anxiety reduction after 8 weeks of evidence-based mindfulness",    icon: Leaf,   color: "#10b981" },
              { stat: "40%",     desc: "of depression episodes remain untreated due to stigma and access", icon: Heart,  color: "#ec4899" },
            ].map(({ stat, desc, icon: Icon, color }) => (
              <div key={stat} className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                <div className="w-11 h-11 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: color + "15" }}>
                  <Icon size={20} style={{ color }}/>
                </div>
                <p className="text-4xl font-black mb-1" style={{ color }}>{stat}</p>
                <p className="text-xs text-gray-500 leading-snug">{desc}</p>
              </div>
            ))}
          </section>
        )}

      </div>

      {/* ── Recommend modal ── */}
      {recommendModal && (
        <RecommendModal resourceId={recommendModal} token={token} onClose={() => setRecommendModal(null)}/>
      )}
    </div>
  );
}
