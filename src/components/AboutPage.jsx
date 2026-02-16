import { useState, useEffect, useRef } from 'react';
import './AboutPage.css';

function AnimatedNumber({ target, duration = 1200 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const start = performance.now();
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{value}</span>;
}

function StageCard({ number, color, title, icon, description, details, delay }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`about-stage-card ${isVisible ? 'visible' : ''}`}
      style={{ '--delay': `${delay}ms`, '--accent': color }}
    >
      <div className="about-stage-number" style={{ background: color }}>
        {icon}
      </div>
      <div className="about-stage-content">
        <h3>{title}</h3>
        <p className="about-stage-desc">{description}</p>
        <ul className="about-stage-details">
          {details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`about-feature ${isVisible ? 'visible' : ''}`}
      style={{ '--delay': `${delay}ms` }}
    >
      <div className="about-feature-icon">{icon}</div>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  );
}

export default function AboutPage({ onNavigateToChat }) {
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="about-page" ref={containerRef}>
      <div className="about-hero">
        <div
          className="about-hero-bg"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        <div className="about-hero-content">
          <div className="about-hero-badge">How It Works</div>
          <h1>The LLM Council</h1>
          <p className="about-hero-subtitle">
            A multi-model deliberation system where AI models collaborate,
            evaluate each other anonymously, and synthesize a superior collective answer.
          </p>
          <button className="about-cta" onClick={onNavigateToChat}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Try It Now
          </button>
        </div>
      </div>

      <section className="about-stats">
        <div className="about-stat">
          <div className="about-stat-value"><AnimatedNumber target={3} /></div>
          <div className="about-stat-label">Deliberation Stages</div>
        </div>
        <div className="about-stat">
          <div className="about-stat-value"><AnimatedNumber target={5} /></div>
          <div className="about-stat-label">Council Models</div>
        </div>
        <div className="about-stat">
          <div className="about-stat-value"><AnimatedNumber target={100} />%</div>
          <div className="about-stat-label">Anonymous Peer Review</div>
        </div>
        <div className="about-stat">
          <div className="about-stat-value"><AnimatedNumber target={1} /></div>
          <div className="about-stat-label">Synthesized Answer</div>
        </div>
      </section>

      <section className="about-overview">
        <div className="about-section-header">
          <h2>Why a Council?</h2>
          <p>
            No single AI model is best at everything. Each has unique strengths, biases,
            and blind spots. The LLM Council harnesses the diversity of multiple models
            to produce answers that are more accurate, balanced, and thoroughly reasoned
            than any individual model could provide alone.
          </p>
        </div>

        <div className="about-comparison">
          <div className="about-comparison-card about-comparison-single">
            <div className="about-comparison-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
              <h4>Single Model</h4>
            </div>
            <ul>
              <li>One perspective</li>
              <li>Potential blind spots</li>
              <li>Model-specific biases</li>
              <li>No quality check</li>
            </ul>
          </div>
          <div className="about-comparison-arrow">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
          <div className="about-comparison-card about-comparison-council">
            <div className="about-comparison-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <h4>LLM Council</h4>
            </div>
            <ul>
              <li>Multiple perspectives</li>
              <li>Cross-validation</li>
              <li>Bias mitigation</li>
              <li>Peer-reviewed quality</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-pipeline">
        <div className="about-section-header">
          <h2>The 3-Stage Pipeline</h2>
          <p>
            Every question goes through a rigorous deliberation process designed
            to extract the best possible answer from a panel of AI models.
          </p>
        </div>

        <div className="about-pipeline-visual">
          <div className="about-pipeline-line" />

          <StageCard
            number={1}
            color="var(--color-primary-500)"
            title="Stage 1: Independent Responses"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            description="Your question is sent simultaneously to all council models. Each model generates its response independently, with no knowledge of what others have said."
            details={[
              "Parallel execution across all models for speed",
              "Complete independence prevents groupthink",
              "Each model brings its unique training and reasoning",
              "Failed models are gracefully excluded, not blocking"
            ]}
            delay={0}
          />

          <StageCard
            number={2}
            color="var(--color-warning-500)"
            title="Stage 2: Anonymous Peer Review"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            }
            description="This is the key innovation. Responses are anonymized as 'Response A', 'Response B', etc. and each model evaluates and ranks all responses without knowing who wrote what."
            details={[
              "Responses relabeled to anonymous identifiers",
              "Prevents models from playing favorites or brand bias",
              "Each model provides detailed evaluation rationale",
              "Rankings are parsed and aggregated into a consensus order"
            ]}
            delay={150}
          />

          <StageCard
            number={3}
            color="var(--color-success-500)"
            title="Stage 3: Chairman Synthesis"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
            description="A designated chairman model receives all individual responses plus the peer rankings. It synthesizes a final, comprehensive answer that draws from the best elements of each contribution."
            details={[
              "Full context: all responses + peer evaluation results",
              "Prioritizes highly-ranked responses",
              "Resolves contradictions between models",
              "Produces a single authoritative answer"
            ]}
            delay={300}
          />
        </div>
      </section>

      <section className="about-anonymization">
        <div className="about-section-header">
          <h2>The Anonymization Process</h2>
          <p>
            Anonymized peer review is the core mechanism that ensures honest, unbiased evaluation.
          </p>
        </div>

        <div className="about-anon-demo">
          <div className="about-anon-step">
            <div className="about-anon-step-badge">Before</div>
            <div className="about-anon-list">
              <div className="about-anon-item about-anon-named">
                <span className="about-anon-model">GPT-4o</span>
                <span className="about-anon-text">The answer is...</span>
              </div>
              <div className="about-anon-item about-anon-named">
                <span className="about-anon-model">Claude</span>
                <span className="about-anon-text">I believe that...</span>
              </div>
              <div className="about-anon-item about-anon-named">
                <span className="about-anon-model">Gemini</span>
                <span className="about-anon-text">Based on my analysis...</span>
              </div>
            </div>
          </div>

          <div className="about-anon-arrow">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span>Anonymize</span>
          </div>

          <div className="about-anon-step">
            <div className="about-anon-step-badge about-anon-step-badge-after">After</div>
            <div className="about-anon-list">
              <div className="about-anon-item about-anon-anonymous">
                <span className="about-anon-label">Response A</span>
                <span className="about-anon-text">The answer is...</span>
              </div>
              <div className="about-anon-item about-anon-anonymous">
                <span className="about-anon-label">Response B</span>
                <span className="about-anon-text">I believe that...</span>
              </div>
              <div className="about-anon-item about-anon-anonymous">
                <span className="about-anon-label">Response C</span>
                <span className="about-anon-text">Based on my analysis...</span>
              </div>
            </div>
          </div>
        </div>

        <p className="about-anon-explanation">
          Models can only see anonymous labels during evaluation. The real identities are mapped
          back after ranking is complete, so you can see which model performed best -- but the
          evaluators never knew.
        </p>
      </section>

      <section className="about-features">
        <div className="about-section-header">
          <h2>Design Principles</h2>
          <p>Every aspect of the Council is designed around transparency and quality.</p>
        </div>
        <div className="about-features-grid">
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            }
            title="Full Transparency"
            description="Every stage is inspectable. You can read each model's raw response, see their evaluations, and verify how rankings were parsed."
            delay={0}
          />
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            }
            title="Parallel Execution"
            description="All models run simultaneously in stages 1 and 2. No sequential bottlenecks -- the council deliberates as fast as the slowest model."
            delay={100}
          />
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            title="Bias Prevention"
            description="Anonymous evaluation prevents models from favoring or penalizing responses based on the source model's identity or reputation."
            delay={200}
          />
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                <path d="M1 9h4v12H1z" />
              </svg>
            }
            title="Graceful Degradation"
            description="If a model fails or times out, the council continues with the remaining models. A single failure never blocks the entire process."
            delay={300}
          />
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
            title="Real-time Streaming"
            description="Results stream in as each stage completes. Watch the deliberation unfold live, from initial responses through to the final synthesis."
            delay={400}
          />
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            }
            title="Structured Output"
            description="Rankings use a strict format that enables reliable parsing. You can see both the raw evaluation text and the extracted ranking order."
            delay={500}
          />
        </div>
      </section>

      <section className="about-flow">
        <div className="about-section-header">
          <h2>Data Flow</h2>
          <p>From your question to the council's answer, visualized step by step.</p>
        </div>
        <div className="about-flow-diagram">
          <div className="about-flow-node about-flow-user">
            <div className="about-flow-node-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span>Your Question</span>
          </div>
          <div className="about-flow-connector" />
          <div className="about-flow-node about-flow-stage1">
            <div className="about-flow-node-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span>Parallel Responses</span>
          </div>
          <div className="about-flow-connector" />
          <div className="about-flow-node about-flow-anon">
            <div className="about-flow-node-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span>Anonymize</span>
          </div>
          <div className="about-flow-connector" />
          <div className="about-flow-node about-flow-review">
            <div className="about-flow-node-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span>Peer Review</span>
          </div>
          <div className="about-flow-connector" />
          <div className="about-flow-node about-flow-synthesis">
            <div className="about-flow-node-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span>Synthesis</span>
          </div>
          <div className="about-flow-connector" />
          <div className="about-flow-node about-flow-answer">
            <div className="about-flow-node-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span>Final Answer</span>
          </div>
        </div>
      </section>

      <section className="about-cta-section">
        <h2>Ready to consult the council?</h2>
        <p>Ask any question and watch multiple AI models deliberate in real time.</p>
        <button className="about-cta about-cta-large" onClick={onNavigateToChat}>
          Start a Conversation
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </section>
    </div>
  );
}
