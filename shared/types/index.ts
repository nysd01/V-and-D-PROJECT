// Shared types and interfaces
export interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  logo?: string;
}

export interface HowItWorksStep {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  text: string;
  avatar?: string;
}

export interface Stat {
  number: string;
  label: string;
  suffix?: string;
}
