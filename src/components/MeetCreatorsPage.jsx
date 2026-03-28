import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, LogOut, Moon, RotateCcw, Sun, Users } from 'lucide-react';

const MENTORS = [
  {
    name: 'Dr. Smitha Rao',
    role: 'Lead Mentor',
    link: 'https://scholar.google.com/citations?user=VcAc7X4AAAAJ&hl=en',
  },
  {
    name: 'Arnold Sachith Hans',
    role: 'Mentor',
    link: 'https://scholar.google.com/citations?user=7tyfnv8AAAAJ&hl=en',
  },
  {
    name: 'Mohit Bansal',
    role: 'Mentor',
    link: 'https://www.linkedin.com/in/mohit-bansal-5a562b43/',
  },
];

const DESIGN_AND_DEVELOPMENT_LEADS = [
  {
    name: 'Ajitesh K',
    role: 'Design and Development Lead',
    link: 'https://github.com/ajiteshkanumuru',
  },
  {
    name: 'Nikita Patil',
    role: 'Design and Development Lead',
    link: 'https://github.com/nikipatil281',
  },
];

const ContributorSection = ({ eyebrow, title, description, people }) => (
  <section className="space-y-4">
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-coffee-400">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-bold text-coffee-100">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-coffee-300">{description}</p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {people.map((person, index) => (
        <motion.a
          key={person.name}
          href={person.link}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
          className="group rounded-2xl border border-coffee-700 bg-coffee-950/70 p-5 shadow-xl transition-all hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_20px_40px_rgba(0,0,0,0.24)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-coffee-100">{person.name}</p>
              <p className="mt-1 text-sm text-amber-300">{person.role}</p>
            </div>
            <span className="rounded-full border border-coffee-700 bg-coffee-900/80 p-2 text-coffee-300 transition-colors group-hover:border-amber-400/50 group-hover:text-amber-200">
              <ExternalLink className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-4 text-sm text-coffee-300">
            Open profile
          </p>
        </motion.a>
      ))}
    </div>
  </section>
);

const MeetCreatorsPage = ({
  theme,
  toggleTheme,
  onBackToQuiz,
  onRestart,
  onExitToLogin,
}) => {
  return (
    <div className={`min-h-screen overflow-y-auto bg-coffee-950 p-4 text-coffee-100 animate-in fade-in duration-500 md:p-8 ${theme}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/20 via-orange-400/10 to-transparent p-3 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.14)]">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-coffee-400">After the quiz</p>
              <h2 className="mt-2 text-3xl font-bold text-coffee-100 md:text-4xl">Meet the Creators</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-coffee-300">
                The coffee RL experience was shaped by mentors, designers, and builders who guided the learning journey from concept to implementation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="self-start rounded-full border border-coffee-700/50 bg-coffee-800/50 p-2 text-coffee-200 transition-all hover:bg-amber-500 hover:text-coffee-900"
          >
            {theme === 'theme-latte' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>

        <div className="rounded-[28px] border border-coffee-700 bg-coffee-900/95 p-6 shadow-2xl md:p-8">
          <div className="mb-8 rounded-2xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/12 via-amber-400/10 to-transparent p-5">
            <p className="text-sm leading-relaxed text-coffee-200">
              Thanks for finishing the policy quiz. This final page highlights the people behind the mentorship, design, and development of the simulation.
            </p>
          </div>

          <div className="space-y-10">
            <ContributorSection
              eyebrow="Mentorship"
              title="Mentors"
              description="Guidance, research perspective, and learning direction for the reinforcement learning experience."
              people={MENTORS}
            />

            <ContributorSection
              eyebrow="Design and Development"
              title="Design and Development Leads"
              description="The team behind the interface, interaction design, and implementation of the simulation experience."
              people={DESIGN_AND_DEVELOPMENT_LEADS}
            />
          </div>

          <div className="mt-10 flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-between">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBackToQuiz}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-coffee-700/50 bg-coffee-800/50 px-4 py-2 text-coffee-300 transition-colors hover:bg-coffee-700/50 hover:text-coffee-100"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Quiz Review
            </motion.button>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRestart}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition-colors shadow-lg shadow-emerald-900/20 hover:bg-emerald-500"
              >
                <RotateCcw className="h-4 w-4" />
                Run Simulation Again
              </motion.button>

              <button
                type="button"
                onClick={onExitToLogin}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition-colors shadow-lg shadow-red-900/20 hover:bg-red-500"
              >
                <LogOut className="h-4 w-4" />
                Exit the Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetCreatorsPage;
