"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Users,
  MessageSquare,
  Briefcase,
  Calendar,
  GraduationCap,
  ArrowRight,
  Globe,
  Award
} from "lucide-react";

const collegeImages = [
  '/college-images/ace-1.jpg',
  '/college-images/ace-2.jpg',
  '/college-images/ace-3.jpg',
];

export default function Home() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-teal-500/5 blur-[80px]" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              ACE-Infinity
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:flex gap-3">
              <Button
                variant="ghost"
                onClick={() => handleNavigation('/auth/signin')}
                className="font-medium hover:bg-primary/5"
              >
                Log In
              </Button>
              <Button
                onClick={() => handleNavigation('/signup')}
                className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
              >
                Join Network
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-24 pb-16">
        {/* Hero Section */}
        <div className="container mx-auto px-6 mb-24">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              className="lg:w-1/2 space-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                The Official Alumni Network
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
                Connect. <br />
                Wait no more. <br />
                <span className="bg-gradient-to-r from-blue-600 to-teal-400 bg-clip-text text-transparent">
                  Grow Together.
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Bridge the gap between students and alumni. Unlock mentorships, career opportunities, and lifelong friendships at ACE Engineering College.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
                  onClick={() => handleNavigation('/signup')}
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-lg border-2 hover:bg-accent/50"
                  onClick={() => handleNavigation('/auth/signin')}
                >
                  Member Login
                </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center gap-4 pt-4 text-sm text-muted-foreground">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
                <p>Join 2,000+ alumni and students already connected.</p>
              </motion.div>
            </motion.div>

            <motion.div
              className="lg:w-1/2 w-full relative"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
            >
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-2">
                <Carousel className="w-full" opts={{ loop: true, align: "start" }}>
                  <CarouselContent>
                    {collegeImages.map((src, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <div className="overflow-hidden rounded-xl aspect-[16/10] relative">
                            <img
                              src={src}
                              alt={`Campus View ${index + 1}`}
                              className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                              <p className="text-white font-medium text-lg">ACE Campus Moments</p>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4 bg-background/80 backdrop-blur-sm border-none hover:bg-background" />
                  <CarouselNext className="right-4 bg-background/80 backdrop-blur-sm border-none hover:bg-background" />
                </Carousel>
              </div>

              {/* Decorative behind elements */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-6 py-24 relative">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">Why Join ACE-Infinity?</h2>
            <p className="text-lg text-muted-foreground">Everything you need to stay connected and advance your career.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Globe className="h-8 w-8 text-blue-500" />,
                title: "Global Network",
                desc: "Connect with alumni working in top companies worldwide. Expand your professional reach beyond campus.",
                color: "bg-blue-500/10 border-blue-500/20"
              },
              {
                icon: <MessageSquare className="h-8 w-8 text-teal-500" />,
                title: "Direct Messaging",
                desc: "Secure, private conversations with mentors and peers. Get advice, referrals, and guidance instantly.",
                color: "bg-teal-500/10 border-teal-500/20"
              },
              {
                icon: <Briefcase className="h-8 w-8 text-amber-500" />,
                title: "Job Opportunities",
                desc: "Exclusive job listings and internship opportunities posted by alumni specifically for ACE students.",
                color: "bg-amber-500/10 border-amber-500/20"
              },
              {
                icon: <Calendar className="h-8 w-8 text-purple-500" />,
                title: "Events & Reunions",
                desc: "Never miss an alumni meet, workshop, or tech talk. Register for events with a single click.",
                color: "bg-purple-500/10 border-purple-500/20"
              },
              {
                icon: <Users className="h-8 w-8 text-rose-500" />,
                title: "Mentorship Program",
                desc: "Find a mentor in your field of interest. Get personalized career guidance and portfolio reviews.",
                color: "bg-rose-500/10 border-rose-500/20"
              },
              {
                icon: <Award className="h-8 w-8 text-indigo-500" />,
                title: "Share Achievements",
                desc: "Showcase your milestones and celebrate the success of fellow ACEians. Inspire the community.",
                color: "bg-indigo-500/10 border-indigo-500/20"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`p-8 rounded-2xl border ${feature.color} backdrop-blur-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-default group`}
              >
                <div className="mb-6 p-3 rounded-xl bg-background w-fit shadow-sm group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-6 py-12">
          <div className="relative rounded-3xl overflow-hidden bg-primary px-6 py-16 md:px-16 md:py-24 text-center text-primary-foreground shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ready to meaningful connections?</h2>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                Join the ACE-Infinity community today. Whether you're a student looking for guidance or an alumni wanting to give back.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14 px-8 text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-primary"
                  onClick={() => handleNavigation('/signup')}
                >
                  Join Now - It's Free
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-muted/30 pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xl font-bold">ACE-Infinity</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The official alumni network platform for ACE Engineering College. Fostering connections, mentorship, and growth.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-lg">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/directory" className="hover:text-primary transition-colors">Directory</Link></li>
                <li><Link href="/events" className="hover:text-primary transition-colors">Events</Link></li>
                <li><Link href="/jobs" className="hover:text-primary transition-colors">Jobs</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-lg">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-primary transition-colors">Stories</Link></li>
                <li><Link href="/newsletter" className="hover:text-primary transition-colors">Newsletter</Link></li>
                <li><Link href="/support" className="hover:text-primary transition-colors">Support</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-lg">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Globe className="h-4 w-4" /> www.aceec.ac.in</li>
                <li className="flex items-center gap-2"><Users className="h-4 w-4" /> alumni@aceec.ac.in</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} ACE-Infinity. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}