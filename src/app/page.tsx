'use client'
import { useState, useEffect } from 'react'
import {
  BookOpen, Star, Trophy, Zap, Globe, FileText,
  ChevronRight, Check, Menu, X, Users, BarChart2,
  Brain, Heart, Sparkles, Play, ArrowRight,
} from 'lucide-react'

// ─── Nav ─────────────────────────────────────────────────────
function Navbar({ scrolled }: { scrolled: boolean }) {
  const [menuOpen, setMenu] = useState(false)

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid #F3F4F6' : 'none',
      boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
      transition: 'all 0.3s ease',
      padding: '0 24px', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: '"Nunito", system-ui, sans-serif',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/icons/icon-512.png" alt="EduPlay"
          style={{ width: 36, height: 36, borderRadius: 10, boxShadow: '0 2px 8px rgba(74,127,212,0.25)' }} />
        <div style={{ fontWeight: 900, fontSize: 18, color: scrolled ? '#111827' : 'white', letterSpacing: '-0.02em' }}>
          Edu<span style={{
            background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Play</span>
        </div>
      </div>

      {/* Desktop links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {['Features', 'How It Works', 'Pricing'].map(link => (
          <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`}
            style={{
              padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13,
              color: scrolled ? '#6B7280' : 'rgba(255,255,255,0.85)',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = scrolled ? '#111827' : 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = scrolled ? '#6B7280' : 'rgba(255,255,255,0.85)')}
          >
            {link}
          </a>
        ))}
        <div style={{ width: 1, height: 20, background: scrolled ? '#E5E7EB' : 'rgba(255,255,255,0.25)', margin: '0 4px' }} />
        <a href="/login" style={{
          padding: '8px 16px', borderRadius: 50,
          border: `1.5px solid ${scrolled ? '#E5E7EB' : 'rgba(255,255,255,0.4)'}`,
          background: 'transparent',
          color: scrolled ? '#374151' : 'white',
          fontWeight: 700, fontSize: 13, textDecoration: 'none',
          transition: 'all 0.15s',
        }}>
          Sign In
        </a>
        <a href="/login" style={{
          padding: '9px 18px', borderRadius: 50,
          background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
          color: 'white', fontWeight: 800, fontSize: 13,
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(74,127,212,0.4)',
          transition: 'all 0.18s ease',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
        >
          Start Free →
        </a>
      </div>
    </nav>
  )
}

// ─── Feature card ─────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, bg }: any) {
  return (
    <div style={{
      background: 'white', borderRadius: 20, padding: '24px 22px',
      border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.09)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: bg, marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ fontWeight: 900, fontSize: 16, color: '#111827', marginBottom: 8, letterSpacing: '-0.01em' }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65 }}>{desc}</div>
    </div>
  )
}

// ─── Step ─────────────────────────────────────────────────────
function Step({ n, icon: Icon, title, desc, badge, color }: any) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: `linear-gradient(135deg,#4A7FD4,#2EC4B6)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(74,127,212,0.35)',
          margin: '0 auto',
        }}>
          <Icon size={26} color="white" />
        </div>
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 22, height: 22, borderRadius: '50%',
          background: '#111827', color: 'white',
          fontSize: 11, fontWeight: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid white',
        }}>
          {n}
        </div>
      </div>
      <div style={{ fontWeight: 900, fontSize: 16, color: '#111827', marginBottom: 8, letterSpacing: '-0.01em' }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, marginBottom: 10, maxWidth: 220, margin: '0 auto 10px' }}>
        {desc}
      </div>
      <span style={{
        display: 'inline-block', padding: '3px 12px', borderRadius: 20,
        background: '#EFF6FF', color: '#4A7FD4',
        fontSize: 11, fontWeight: 800,
      }}>
        {badge}
      </span>
    </div>
  )
}

// ─── Testimonial ──────────────────────────────────────────────
function Testimonial({ quote, name, role, emoji }: any) {
  return (
    <div style={{
      background: 'white', borderRadius: 20, padding: '22px',
      border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      transition: 'all 0.2s ease',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'
      }}
    >
      {/* Stars */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
        ))}
      </div>
      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 16px' }}>
        "{quote}"
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {emoji}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#111827' }}>{name}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{role}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Landing ─────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div style={{ fontFamily: '"Nunito", system-ui, sans-serif', background: '#FFFFFF', color: '#111827' }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @media(max-width:768px) {
          .hero-grid { grid-template-columns: 1fr !important; text-align: center !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .steps-row { flex-direction: column !important; align-items: center !important; }
          .step-divider { display: none !important; }
          .test-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .hero-ctas { justify-content: center !important; }
        }
      `}</style>

      <Navbar scrolled={scrolled} />

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1E3A5F 0%, #2A5298 40%, #1A7A5E 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Blobs */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,127,212,0.25), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,196,182,0.2), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.05), transparent)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="hero-grid">
          {/* Left */}
          <div style={{ animation: 'slideUp 0.6s ease' }}>
            {/* Trust badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 20, marginBottom: 20,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
            }}>
              <Sparkles size={13} color="#FFD700" fill="#FFD700" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                Trusted by 500+ families · Free to start
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(34px, 5vw, 58px)',
              fontWeight: 900, lineHeight: 1.1,
              letterSpacing: '-0.03em', color: 'white',
              marginBottom: 20,
            }}>
              Learning that{' '}
              <span style={{
                background: 'linear-gradient(135deg,#60D8C5,#93C5FD)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                feels like play
              </span>
            </h1>

            <p style={{
              fontSize: 18, color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.65, marginBottom: 32, maxWidth: 480,
            }}>
              EduPlay turns K–6 Math, English and Hebrew into an engaging adventure.
              Kids earn XP, unlock animal cards, and actually want to study.
            </p>

            <div className="hero-ctas" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <a href="/login" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 26px', borderRadius: 50,
                background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                color: 'white', fontWeight: 900, fontSize: 15,
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(74,127,212,0.5)',
                transition: 'all 0.18s ease',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
              >
                <Play size={16} fill="white" /> Start Free Today
              </a>
              <a href="#how-it-works" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 24px', borderRadius: 50,
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                color: 'white', fontWeight: 700, fontSize: 15,
                textDecoration: 'none', transition: 'all 0.18s ease',
              }}>
                How it works <ChevronRight size={15} />
              </a>
            </div>

            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              ✓ No credit card required &nbsp;·&nbsp; ✓ Free plan available &nbsp;·&nbsp; ✓ Grades K–6
            </div>
          </div>

          {/* Right — app preview */}
          <div style={{ animation: 'slideUp 0.7s ease 0.1s both' }}>
            <div style={{
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
              borderRadius: 24, padding: 20,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
            }}>
              {/* Mock dashboard */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 8, fontWeight: 700 }}>
                  Good morning, Hila! 👋
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[
                    { label: 'Total XP', value: '1,250', color: '#F59E0B' },
                    { label: 'Streaks', value: '3 🔥', color: '#EF4444' },
                    { label: 'Lessons', value: '24', color: '#10B981' },
                    { label: 'Cards', value: '8/62', color: '#4A7FD4' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 900, fontSize: 16, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: 700 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Mock child cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[
                  { name: 'Tamar', grade: '4', emoji: '🐻', pct: 65, color: '#4A7FD4' },
                  { name: 'Lia', grade: '6', emoji: '🐱', pct: 40, color: '#EF4444' },
                  { name: 'Tom', grade: 'K', emoji: '🦊', pct: 20, color: '#8B5CF6' },
                ].map(child => (
                  <div key={child.name} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{child.emoji}</div>
                    <div style={{ fontWeight: 800, fontSize: 12, color: 'white' }}>{child.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Grade {child.grade}</div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${child.pct}%`, background: child.color, borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating notification */}
            <div style={{
              position: 'absolute', bottom: -10, right: -10,
              background: 'white', borderRadius: 14, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              animation: 'float 3s ease-in-out infinite',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} fill="#F59E0B" color="#F59E0B" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#111827' }}>+25 XP earned!</div>
                <div style={{ fontSize: 10, color: '#9CA3AF' }}>Tamar answered correctly</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 20, marginBottom: 14,
              background: '#EFF6FF', color: '#4A7FD4', fontSize: 12, fontWeight: 800,
            }}>
              Features
            </span>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-0.02em', marginBottom: 12 }}>
              Everything kids need to thrive
            </h2>
            <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 520, margin: '0 auto' }}>
              Built for Israeli K–6 families with a curriculum that matches the school year.
            </p>
          </div>

          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            <FeatureCard icon={Brain}     color="#4A7FD4" bg="#EFF6FF" title="Adaptive Learning"      desc="Questions adjust to each child's level. Struggling students get hints; advanced learners get harder challenges." />
            <FeatureCard icon={Trophy}    color="#F59E0B" bg="#FEF3C7" title="XP & Animal Cards"      desc="Kids earn XP for every correct answer and unlock animal cards from around the world. Learning feels like a game." />
            <FeatureCard icon={FileText}  color="#10B981" bg="#D1FAE5" title="Worksheet Builder"      desc="Generate print-ready PDF worksheets in seconds. Choose topic, difficulty and question count." />
            <FeatureCard icon={Globe}     color="#8B5CF6" bg="#F5F3FF" title="Bilingual Support"      desc="Fully bilingual — Hebrew and English side-by-side. Perfect for Israeli families and English learners." />
            <FeatureCard icon={BarChart2} color="#EF4444" bg="#FEE2E2" title="Parent Dashboard"       desc="See exactly where each child is struggling. Focus recommendations, streaks, and progress reports." />
            <FeatureCard icon={Heart}     color="#EC4899" bg="#FCE7F3" title="Activity Breaks"        desc="Built-in movement breaks with exercise videos. Keeps kids refreshed and focused throughout sessions." />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: '#F9FAFB', padding: '80px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 20, marginBottom: 14,
              background: '#F0FDFB', color: '#2EC4B6', fontSize: 12, fontWeight: 800,
            }}>
              How It Works
            </span>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-0.02em', marginBottom: 12 }}>
              Up and running in 3 minutes
            </h2>
          </div>

          <div className="steps-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 0, justifyContent: 'center' }}>
            <Step n={1} icon={Users}     title="Create Family Account" desc="Sign up free and add your children with their grade level and preferred learning language." badge="Takes 2 min" color="#4A7FD4" />
            <div className="step-divider" style={{ flex: 1, height: 2, background: 'linear-gradient(90deg,#4A7FD4,#2EC4B6)', margin: '32px 8px 0', borderRadius: 2 }} />
            <Step n={2} icon={BookOpen}  title="Child Picks a Topic"   desc="Kids log in with their PIN and choose what to learn. Topics match the Israeli school curriculum." badge="Fun & engaging" color="#2EC4B6" />
            <div className="step-divider" style={{ flex: 1, height: 2, background: 'linear-gradient(90deg,#2EC4B6,#10B981)', margin: '32px 8px 0', borderRadius: 2 }} />
            <Step n={3} icon={Trophy}    title="Earn XP & Unlock Cards" desc="Every correct answer earns XP. Collect animal cards from Africa, Asia, Europe and more!" badge="Instantly rewarding" color="#10B981" />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 20, marginBottom: 14,
              background: '#FEF3C7', color: '#B45309', fontSize: 12, fontWeight: 800,
            }}>
              Loved by families
            </span>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(26px,4vw,38px)', letterSpacing: '-0.02em' }}>
              Parents love it. Kids ask for more.
            </h2>
          </div>

          <div className="test-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            <Testimonial
              quote="My daughter used to dread homework. Now she asks to do EduPlay before bed. The animal cards are genius."
              name="Hila M." role="Parent of 3, Tel Aviv" emoji="👩"
            />
            <Testimonial
              quote="The worksheet builder alone is worth it. I generate practice sheets for my students in seconds."
              name="Dalia K." role="Primary school teacher" emoji="👩‍🏫"
            />
            <Testimonial
              quote="Finally a Hebrew-English bilingual app that doesn't look like it was made in 2010. My kids love the themes!"
              name="Oren H." role="Parent of 2, Haifa" emoji="👨"
            />
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ background: '#F9FAFB', padding: '80px 24px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 20, marginBottom: 14,
            background: '#EFF6FF', color: '#4A7FD4', fontSize: 12, fontWeight: 800,
          }}>
            Pricing
          </span>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(26px,4vw,38px)', letterSpacing: '-0.02em', marginBottom: 10 }}>
            Start completely free
          </h2>
          <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 36 }}>
            No credit card. No hidden fees. Just learning.
          </p>

          {/* Pricing card */}
          <div style={{
            background: 'white', borderRadius: 24, padding: '32px 28px',
            border: '2px solid #4A7FD4',
            boxShadow: '0 8px 32px rgba(74,127,212,0.15)',
          }}>
            {/* Price */}
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 900, fontSize: 64, color: '#4A7FD4', letterSpacing: '-0.03em', lineHeight: 1 }}>$0</span>
            </div>
            <div style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 28, fontWeight: 600 }}>
              Free during beta · Paid plans coming soon
            </div>

            {/* Feature list */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 28, textAlign: 'left' }}>
              {[
                'Unlimited lessons',
                'All subjects (Math, English, Hebrew)',
                'Up to 3 children',
                'Worksheet builder (PDF)',
                'Animal card collection',
                'Parent dashboard',
                'Progress reports',
                'Bilingual support',
                'Activity breaks',
                'Multiple themes',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={10} color="#10B981" strokeWidth={3} />
                  </div>
                  {f}
                </div>
              ))}
            </div>

            <a href="/login" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '15px',
              borderRadius: 50, background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
              color: 'white', fontWeight: 900, fontSize: 16,
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(74,127,212,0.4)',
              transition: 'all 0.18s ease',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
            >
              Get Started Free <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        background: 'linear-gradient(135deg,#1E3A5F,#2A5298,#1A7A5E)',
        padding: '80px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🦔</div>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(28px,4vw,42px)', color: 'white', letterSpacing: '-0.02em', marginBottom: 14 }}>
            Ready to make learning fun?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 32, lineHeight: 1.65 }}>
            Join hundreds of families who've turned screen time into learning time.
          </p>
          <a href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '16px 32px', borderRadius: 50,
            background: 'white', color: '#1E3A5F',
            fontWeight: 900, fontSize: 16, textDecoration: 'none',
            boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
            transition: 'all 0.18s ease',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
          >
            <Sparkles size={18} color="#4A7FD4" /> Start Free — No Credit Card
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#111827', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32, marginBottom: 36 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <img src="/icons/icon-512.png" alt="EduPlay" style={{ width: 32, height: 32, borderRadius: 9 }} />
                <div style={{ fontWeight: 900, fontSize: 17, color: 'white' }}>
                  Edu<span style={{ background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Play</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.65, maxWidth: 260 }}>
                K–6 learning platform for Israeli families. Math, English and Hebrew — all in one place.
              </p>
            </div>
            {/* Links */}
            {[
              { title: 'Product',  links: ['Features', 'How It Works', 'Pricing', 'Curriculum'] },
              { title: 'Company', links: ['About', 'Blog', 'Contact', 'Careers'] },
              { title: 'Legal',   links: ['Privacy', 'Terms', 'Cookie Policy'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight: 800, fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
                  {col.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                    >
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1F2937', paddingTop: 24, textAlign: 'center', fontSize: 12, color: '#4B5563' }}>
            © {new Date().getFullYear()} EduPlay. Made with ❤️ for families.
          </div>
        </div>
      </footer>
    </div>
  )
}
