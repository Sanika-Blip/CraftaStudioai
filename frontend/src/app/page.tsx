"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Code2, Cpu, Zap, History, CheckCircle, ChevronDown, Sparkles, Terminal, Layers, Play, Database, Globe, MessageSquare, Mail } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    { question: "What is CraftaStudio?", answer: "CraftaStudio is an AI-powered software architecture platform that visually plans and generates production-ready backend code based on your prompts." },
    { question: "How does the AI generation work?", answer: "We use a multi-agent system powered by Groq and Sarvam AI to understand your requirements, map out the architecture, and write the code block-by-block." },
    { question: "Can I use my own infrastructure?", answer: "Yes, the code generated is standard Fastify/Node.js and Python, which you can deploy anywhere, including Railway, Supabase, or AWS." },
    { question: "Is CraftaStudio suitable for beginners?", answer: "While designed for professional architects to speed up their workflow, beginners can use it to learn how complex systems are structured and built." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.5)]">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold tracking-tight">CraftaStudio</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
        </nav>
        <div>
          {isLoaded && isSignedIn ? (
            <Link href="/dashboard" className="px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all">
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/sign-in" className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors">
                Log In
              </Link>
              <Link href="/sign-up" className="px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-4 flex flex-col items-center text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 mb-8 backdrop-blur-md">
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">CraftaStudio v1.0 is live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Smarter Architecture<br />
            <span className="text-zinc-400 font-medium">Starts with CraftaStudio</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12">
            The premium AI workspace to plan, visualize, and generate your backend code in minutes, giving you total control of the output.
          </p>

          <div className="w-full max-w-xl relative group mb-8">
            <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
            <div className="relative flex items-center bg-[#1c1c1c] border border-zinc-800 rounded-full p-2 pl-6 shadow-2xl">
              <span className="text-zinc-500 text-lg mr-3">🔗</span>
              <input 
                type="text" 
                placeholder="Type any architecture you'd like..." 
                className="bg-transparent border-none outline-none text-white w-full placeholder:text-zinc-500 text-sm"
                disabled
              />
              <Link href={isSignedIn ? "/dashboard" : "/sign-up"} className="whitespace-nowrap px-6 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-full transition-all">
                Generate Now
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              { text: "Generate auth flow", icon: "🛡️" },
              { text: "Build user schema", icon: "</>" },
              { text: "Create Stripe webhook", icon: "💳" },
              { text: "More Ideas", icon: "" }
            ].map((chip, idx) => (
              <Link href="/sign-up" key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-[#141414] hover:bg-[#1c1c1c] text-xs font-medium text-zinc-300 transition-colors">
                {chip.icon && <span>{chip.icon}</span>}
                {chip.text}
              </Link>
            ))}
          </div>
        </section>

        {/* Hero Image Mockup */}
        <section className="px-6 mb-24 max-w-6xl mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-[#0f0f0f] p-2 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
            <div className="rounded-xl border border-zinc-800/50 bg-[#141414] h-[400px] md:h-[600px] flex flex-col relative overflow-hidden">
              {/* Mock Header */}
              <div className="h-12 border-b border-zinc-800 flex items-center px-4 justify-between">
                <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500/20"></div><div className="w-3 h-3 rounded-full bg-yellow-500/20"></div><div className="w-3 h-3 rounded-full bg-green-500/20"></div></div>
                <div className="text-xs text-zinc-500 font-mono">project_architect_flow</div>
                <div></div>
              </div>
              {/* Mock Body */}
              <div className="flex-1 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="text-center z-10 w-full max-w-lg">
                  <div className="w-16 h-16 bg-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-400">
                    <Sparkles size={32} />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Welcome Back,<br/>How Can I Help You?</h2>
                  <div className="flex justify-center gap-3 mt-8">
                    <div className="px-4 py-2 rounded-full border border-zinc-800 bg-[#1c1c1c] text-xs font-medium text-zinc-400">🛡️ Generate auth flow</div>
                    <div className="px-4 py-2 rounded-full border border-zinc-800 bg-[#1c1c1c] text-xs font-medium text-zinc-400">🛡️ Generate auth flow</div>
                  </div>
                  <div className="flex justify-center gap-3 mt-3">
                    <div className="px-4 py-2 rounded-full border border-zinc-800 bg-[#1c1c1c] text-xs font-medium text-zinc-400">🛡️ Generate auth flow</div>
                    <div className="px-4 py-2 rounded-full border border-zinc-800 bg-[#1c1c1c] text-xs font-medium text-zinc-400">🛡️ Generate auth flow</div>
                    <div className="px-4 py-2 rounded-full border border-zinc-800 bg-[#1c1c1c] text-xs font-medium text-zinc-400">🛡️ Generate auth flow</div>
                  </div>
                </div>
                
                {/* Bottom Mock Input */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl">
                  <div className="flex items-center bg-[#1c1c1c] border border-zinc-800 rounded-full p-1.5 pl-6 shadow-2xl opacity-50">
                    <span className="text-zinc-600 text-sm mr-3">🔗</span>
                    <input type="text" placeholder="Type any architecture you'd like..." className="bg-transparent border-none outline-none text-zinc-600 w-full text-xs" disabled />
                    <div className="whitespace-nowrap px-4 py-1.5 text-xs font-semibold text-white/50 bg-purple-600/50 rounded-full">Generate Now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logo Cloud */}
        <section className="py-10 border-y border-zinc-900 bg-[#0a0a0a]/50 text-center">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-8">Trusted by 1,000+ software architects</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale">
            <div className="flex items-center gap-2 font-bold text-xl"><Terminal size={24}/> TechCorp</div>
            <div className="flex items-center gap-2 font-bold text-xl"><Database size={24}/> DataFlow</div>
            <div className="flex items-center gap-2 font-bold text-xl"><Cpu size={24}/> NexusAI</div>
            <div className="flex items-center gap-2 font-bold text-xl"><Layers size={24}/> StackBuild</div>
          </div>
        </section>

        {/* Features 4-Grid */}
        <section id="features" className="py-24 px-6 max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Empowering Your<br/>Workflow with AI Features</h2>
          <p className="text-zinc-400 mb-16 max-w-2xl mx-auto">Stop writing boilerplate. Let CraftaStudio analyze, structure, and generate the foundation while you focus on the core logic.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: <Layers size={24} className="text-purple-400"/>, title: "Visual Planning", desc: "See your architecture before code is written. Drag, drop, and connect." },
              { icon: <Terminal size={24} className="text-purple-400"/>, title: "Instant Generation", desc: "Convert visual blocks into Fastify, Python, or Next.js code instantly." },
              { icon: <Cpu size={24} className="text-purple-400"/>, title: "Multi-Agent Hub", desc: "Leverage Groq, Gemini, and Sarvam simultaneously for different tasks." },
              { icon: <History size={24} className="text-purple-400"/>, title: "History & Export", desc: "Never lose a run. Browse history, view diffs, and export to ZIP." }
            ].map((f, i) => (
              <div key={i} className="bg-[#141414] border border-zinc-800 rounded-2xl p-8 text-left hover:border-purple-500/50 transition-colors group">
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 border border-zinc-800 group-hover:bg-purple-500/10 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Split 1 */}
        <section id="how-it-works" className="py-24 px-6 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2">
              <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center"><Sparkles size={14}/></div>
                  <div className="bg-zinc-800 px-4 py-2 rounded-2xl rounded-tl-sm text-sm">Create a microservice architecture for a SaaS app.</div>
                </div>
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-300">
                  <p><span className="text-purple-400">const</span> <span className="text-blue-400">fastify</span> = <span className="text-yellow-300">require</span>(<span className="text-green-400">'fastify'</span>)();</p>
                  <p className="mt-2"><span className="text-zinc-500">// Generating block-auth...</span></p>
                  <p className="mt-2"><span className="text-blue-400">fastify</span>.<span className="text-yellow-300">register</span>(<span className="text-green-400">'@fastify/jwt'</span>, &#123;</p>
                  <p className="pl-4">secret: process.env.<span className="text-purple-400">JWT_SECRET</span></p>
                  <p>&#125;);</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button className="px-4 py-2 bg-purple-600 text-xs font-bold rounded-lg">Confirm & Continue</button>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Bring Your Coding Ideas to Life by Entering Just a Few Prompts</h2>
              <p className="text-zinc-400 mb-8 text-lg">
                CraftaStudio bridges the gap between idea and execution. Just describe what you need, and our AI constructs the precise architecture and backend logic, pausing for your review.
              </p>
              <Link href="/sign-up" className="px-6 py-3 border border-zinc-700 hover:bg-zinc-800 rounded-full font-semibold transition-all">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Split 2 */}
        <section className="py-24 px-6 max-w-6xl mx-auto">
          <div className="flex flex-col-reverse md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Never Lose Your Progress: Store and Reopen Your History Anytime</h2>
              <p className="text-zinc-400 mb-8 text-lg">
                Stay in control of your workflow. Every prompt, plan, and generated block is securely stored. Easily revert to past runs or export the entire codebase to your local machine.
              </p>
              <Link href="/sign-up" className="px-6 py-3 border border-zinc-700 hover:bg-zinc-800 rounded-full font-semibold transition-all">
                View History
              </Link>
            </div>
            <div className="w-full md:w-1/2">
              <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                  <h3 className="font-bold">Workflow History</h3>
                  <span className="text-xs text-zinc-500">Last 7 days v</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "SaaS Authentication Flow", time: "2 hours ago", active: true },
                    { name: "Payment Gateway Integration", time: "1 day ago", active: false },
                    { name: "User Profile Schema", time: "3 days ago", active: false }
                  ].map((h, i) => (
                    <div key={i} className={`flex justify-between items-center p-3 rounded-lg border ${h.active ? 'bg-purple-500/10 border-purple-500/30' : 'bg-[#0a0a0a] border-zinc-800'}`}>
                      <div className="flex items-center gap-3">
                        <History size={16} className={h.active ? 'text-purple-400' : 'text-zinc-500'} />
                        <span className="text-sm font-medium">{h.name}</span>
                      </div>
                      <span className="text-xs text-zinc-500">{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 px-6 max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Transparent Pricing.<br/>No Extra Hidden Fees</h2>
          <p className="text-zinc-400 mb-16">Choose the plan that best fits your architecture needs.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-8 text-left flex flex-col">
              <h3 className="text-xl font-bold mb-2">Starter</h3>
              <p className="text-sm text-zinc-400 mb-6">Perfect for solo developers and hobbyists.</p>
              <div className="text-4xl font-extrabold mb-8">$0<span className="text-lg text-zinc-500 font-normal">/month</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {["5 AI generations per month", "Standard models (Gemini)", "Basic canvas export", "Community support"].map((ft, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle size={16} className="text-zinc-500" /> {ft}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="w-full block text-center px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-semibold transition-all">
                Get Started Free
              </Link>
            </div>
            
            {/* Pro */}
            <div className="bg-gradient-to-b from-[#1a1025] to-[#141414] border border-purple-500/50 rounded-2xl p-8 text-left relative flex flex-col transform md:-translate-y-4 shadow-[0_0_30px_rgba(147,51,234,0.15)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>
              <h3 className="text-xl font-bold mb-2 text-purple-400">Pro</h3>
              <p className="text-sm text-zinc-400 mb-6">For professional architects and small teams.</p>
              <div className="text-4xl font-extrabold mb-8">$29<span className="text-lg text-zinc-500 font-normal">/month</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {["Unlimited AI generations", "Premium models (Groq/Llama 3)", "Advanced visual planning", "ZIP Export & Github Push", "Priority support"].map((ft, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-200">
                    <CheckCircle size={16} className="text-purple-500" /> {ft}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="w-full block text-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold transition-all">
                Start Pro Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-8 text-left flex flex-col">
              <h3 className="text-xl font-bold mb-2">Enterprise</h3>
              <p className="text-sm text-zinc-400 mb-6">Custom limits for scaling organizations.</p>
              <div className="text-4xl font-extrabold mb-8">$99<span className="text-lg text-zinc-500 font-normal">/month</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {["Everything in Pro", "Custom LLM integrations", "Team collaboration features", "Dedicated account manager", "SLA guarantees"].map((ft, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle size={16} className="text-zinc-500" /> {ft}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="w-full block text-center px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full font-semibold transition-all">
                Contact Sales
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 px-6 max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">Success Stories<br/><span className="text-zinc-400 font-medium">from Our Happy Clients</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              { text: "CraftaStudio completely revolutionized how I plan my backends. The visual canvas mixed with instantaneous Groq code generation is a game changer.", name: "Alex Mercer", title: "Indie Hacker" },
              { text: "We used to spend weeks whiteboarding microservices. Now we describe it to CraftaStudio, review the generated Fastify code, and deploy in hours.", name: "Sarah Chen", title: "CTO at Nexus" },
              { text: "The human-in-the-loop review process is what sold me. It's not a black box; I confirm every block of code before it gets added to my project.", name: "David Kim", title: "Senior Architect" }
            ].map((t, i) => (
              <div key={i} className="bg-[#141414] border border-zinc-800 rounded-2xl p-8 flex flex-col">
                <div className="w-12 h-12 bg-zinc-800 rounded-full mb-6"></div>
                <p className="text-sm text-zinc-300 leading-relaxed italic mb-6 flex-1">"{t.text}"</p>
                <div>
                  <h4 className="font-bold text-sm">{t.name}</h4>
                  <p className="text-xs text-zinc-500">{t.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 px-6 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-1/3">
              <h2 className="text-3xl font-bold mb-4">Frequently<br/>Asked Questions</h2>
              <p className="text-zinc-400 text-sm mb-6">Have more questions? Reach out to our team.</p>
              <button className="px-6 py-2.5 bg-white text-black font-bold rounded-full text-sm">Contact Us</button>
            </div>
            <div className="md:w-2/3 space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-zinc-800 bg-[#141414] rounded-xl overflow-hidden">
                  <button 
                    className="w-full px-6 py-4 flex justify-between items-center text-left font-semibold"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {faq.question}
                    <ChevronDown size={16} className={`text-zinc-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-12 px-6 max-w-6xl mx-auto mb-24">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-12 text-center relative overflow-hidden shadow-[0_0_40px_rgba(147,51,234,0.3)]">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 relative z-10">Ready to Transform<br/>Your Workflow?</h2>
            <p className="text-purple-100 mb-8 max-w-xl mx-auto relative z-10">Join thousands of architects building the future of software with CraftaStudio.</p>
            <Link href="/sign-up" className="inline-block px-8 py-4 bg-[#0a0a0a] text-white hover:bg-black rounded-full font-bold transition-all shadow-xl relative z-10">
              Start Building Now
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#0a0a0a] py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="font-bold tracking-tight">CraftaStudio</span>
            </div>
            <p className="text-sm text-zinc-500 max-w-xs mb-6">
              The premier AI-powered software architecture and generation workspace.
            </p>
            <div className="flex gap-4 text-zinc-500">
              <Globe size={20} className="hover:text-white cursor-pointer" />
              <MessageSquare size={20} className="hover:text-white cursor-pointer" />
              <Mail size={20} className="hover:text-white cursor-pointer" />
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="#" className="hover:text-white">Features</Link></li>
              <li><Link href="#" className="hover:text-white">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white">Changelog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="#" className="hover:text-white">About</Link></li>
              <li><Link href="#" className="hover:text-white">Blog</Link></li>
              <li><Link href="#" className="hover:text-white">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="#" className="hover:text-white">Privacy</Link></li>
              <li><Link href="#" className="hover:text-white">Terms</Link></li>
              <li><Link href="#" className="hover:text-white">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-8 border-t border-zinc-900 text-center text-sm text-zinc-600">
          &copy; {new Date().getFullYear()} CraftaStudio. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
