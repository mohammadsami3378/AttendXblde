import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ role, title, subtitle, children }) {
  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex gap-4">
          <Sidebar role={role} />
          <main className="min-w-0 flex-1">
            <Topbar title={title} subtitle={subtitle} />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-4"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

