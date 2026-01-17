import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

const featureVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

const features = [
  "Create and manage multiple profiles",
  "Lock websites with password protection",
  "Block distracting websites completely",
  "Redirect URLs to alternative destinations",
  "Encrypted local storage for security",
];

export function AboutScreen() {
  return (
    <motion.div
      className="p-6 max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="mb-6" variants={itemVariants}>
        <h1 className="text-3xl font-bold text-foreground">About Link Lock</h1>
        <p className="text-muted-foreground mt-2">Version 1.0.0</p>
      </motion.div>

      <div className="space-y-6">
        <motion.div
          className="bg-card border border-border rounded-lg p-6"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 250, damping: 20 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-3">
            What is Link Lock?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Link Lock is a browser extension that helps you manage your browsing
            experience by allowing you to lock, block, or redirect specific
            websites. Create different profiles for different contexts like
            Work, Focus, or Personal browsing.
          </p>
        </motion.div>

        <motion.div
          className="bg-card border border-border rounded-lg p-6"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Features
          </h2>
          <motion.ul
            className="space-y-2 text-muted-foreground"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {features.map((feature, index) => (
              <motion.li
                key={index}
                className="flex items-start"
                variants={featureVariants}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
              >
                <motion.span
                  className="text-primary mr-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.1 + index * 0.04,
                    type: "spring",
                    stiffness: 350,
                    damping: 20,
                  }}
                >
                  ✓
                </motion.span>
                <span>{feature}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          className="bg-card border border-border rounded-lg p-6"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 250, damping: 20 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Privacy
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            All your data is stored locally on your device using AES-GCM
            encryption. We never send your data to external servers. Your
            profiles, rules, and settings remain completely private.
          </p>
        </motion.div>

        <motion.div
          className="bg-card border border-border rounded-lg p-6"
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 250, damping: 20 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Support
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Need help or found a bug?
          </p>
          <motion.a
            href="https://github.com/narayann7/LinkLock"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-primary hover:text-primary/80 transition"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
          >
            Visit our GitHub repository →
          </motion.a>
        </motion.div>

        <motion.div
          className="text-center text-sm text-muted-foreground pt-6"
          variants={itemVariants}
        >
          <p>Made with care for better browsing habits</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
