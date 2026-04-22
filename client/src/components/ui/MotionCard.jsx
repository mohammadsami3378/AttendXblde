import { motion } from "framer-motion";

export default function MotionCard({ children, className = "", ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={["glass rounded-2xl", className].join(" ")}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

