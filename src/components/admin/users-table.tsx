"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Download, ChevronDown, Mail, User, Building2, Calendar, Activity } from "lucide-react";
import type { User as UserType, UserDetails } from "@/lib/mock/users";
import { getUserDetails } from "@/lib/mock/users";

interface UsersTableProps {
  title?: string;
  users?: UserType[];
  onUserSelect?: (userId: string) => void;
  className?: string;
  enableAnimations?: boolean;
}

type SortField = "name" | "email" | "status" | "workspaceCount" | "registrationDate" | "lastLogin";
type SortOrder = "asc" | "desc";

export function UsersTable({
  title = "User",
  users: initialUsers = [],
  onUserSelect,
  className = "",
  enableAnimations = true
}: UsersTableProps = {}) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [openDropdownUserId, setOpenDropdownUserId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { theme } = useTheme();
  const isDark = theme === "dark" || (!theme && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
    if (onUserSelect) {
      onUserSelect(userId);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setShowSortMenu(false);
    setCurrentPage(1);
  };

  const handleFilter = (status: string | null) => {
    setFilterStatus(status);
    setShowFilterMenu(false);
    setCurrentPage(1);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatRelativeDate = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    return formatDate(date);
  };

  const sortedAndFilteredUsers = useMemo(() => {
    let filtered = [...initialUsers];

    if (filterStatus) {
      filtered = filtered.filter(u => u.status === filterStatus);
    }

    if (!sortField) {
      return filtered;
    }

    const sorted = filtered.sort((a, b) => {
      let aVal: string | number | Date | null = a[sortField];
      let bVal: string | number | Date | null = b[sortField];

      if (sortField === "status") {
        const statusMap = { "inactive": 0, "active": 1 };
        aVal = statusMap[aVal as keyof typeof statusMap];
        bVal = statusMap[bVal as keyof typeof statusMap];
      }

      if (sortField === "name") {
        aVal = (a.name || a.email).toLowerCase();
        bVal = (b.name || b.email).toLowerCase();
      }

      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();
      if (aVal === null) aVal = 0;
      if (bVal === null) bVal = 0;

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [initialUsers, sortField, sortOrder, filterStatus]);

  const paginatedUsers = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredUsers.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [sortedAndFilteredUsers, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredUsers.length / ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    if (!mounted) {
      const statusMap: Record<string, { bgColor: string; borderColor: string; textColor: string; dotColor: string }> = {
        "inactive": {
          bgColor: "bg-gray-500/10",
          borderColor: "border-gray-500/30",
          textColor: "text-gray-400",
          dotColor: "bg-gray-400"
        },
        "active": {
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
          textColor: "text-green-400",
          dotColor: "bg-green-400"
        }
      };
      return statusMap[status] || statusMap["inactive"];
    }

    const statusMap: Record<string, { bgColor: string; borderColor: string; textColor: string; dotColor: string }> = {
      "inactive": {
        bgColor: isDark ? "bg-gray-500/10" : "bg-gray-50",
        borderColor: isDark ? "border-gray-500/30" : "border-gray-200",
        textColor: isDark ? "text-gray-400" : "text-gray-600",
        dotColor: isDark ? "bg-gray-400" : "bg-gray-600"
      },
      "active": {
        bgColor: isDark ? "bg-green-500/10" : "bg-green-50",
        borderColor: isDark ? "border-green-500/30" : "border-green-200",
        textColor: isDark ? "text-green-400" : "text-green-600",
        dotColor: isDark ? "bg-green-400" : "bg-green-600"
      }
    };

    return statusMap[status] || statusMap["inactive"];
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Status", "Workspaces", "Registration Date", "Last Login"];
    const rows = sortedAndFilteredUsers.map(user => [
      user.name || "",
      user.email,
      user.status,
      user.workspaceCount,
      formatDate(user.registrationDate),
      user.lastLogin ? formatDate(user.lastLogin) : "Never"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(sortedAndFilteredUsers, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  const containerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1,
      },
    }
  };

  const rowVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.98,
      filter: "blur(4px)" 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
        mass: 0.7,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`px-3 py-1.5 bg-background border border-gray-4300 text-foreground text-sm hover:bg-gray-2000/50 transition-colors flex items-center gap-2 rounded-md ${filterStatus ? 'ring-2 ring-primary/30' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 3H14M4 8H12M6 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Filter
              {filterStatus && <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-sm px-1.5 py-0.5">1</span>}
            </button>
            
            {showFilterMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowFilterMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-44 bg-background border border-gray-4300 shadow-lg rounded-md z-20 py-1">
                  <button
                    onClick={() => handleFilter(null)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${!filterStatus ? 'bg-muted/30' : ''}`}
                  >
                    All Users
                  </button>
                  <div className="h-px bg-gray-2000 my-1" />
                  {["active", "inactive"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleFilter(status)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 capitalize ${filterStatus === status ? 'bg-muted/30' : ''}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="px-3 py-1.5 bg-background border border-gray-4300 text-foreground text-sm hover:bg-gray-2000/50 transition-colors flex items-center gap-2 rounded-md"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 6L6 3L9 6M6 3V13M13 10L10 13L7 10M10 13V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sort {sortField && <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-sm px-1.5 py-0.5">1</span>}
              <ChevronDown size={14} className="opacity-50" />
            </button>
            
            {showSortMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-background border border-gray-4300 shadow-lg rounded-md z-20 py-1">
                  <button
                    onClick={() => handleSort("name")}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${sortField === "name" ? 'bg-muted/30' : ''}`}
                  >
                    Name {sortField === "name" && `(${sortOrder === "asc" ? "A-Z" : "Z-A"})`}
                  </button>
                  <button
                    onClick={() => handleSort("email")}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${sortField === "email" ? 'bg-muted/30' : ''}`}
                  >
                    Email {sortField === "email" && `(${sortOrder === "asc" ? "A-Z" : "Z-A"})`}
                  </button>
                  <button
                    onClick={() => handleSort("status")}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${sortField === "status" ? 'bg-muted/30' : ''}`}
                  >
                    Status {sortField === "status" && `(${sortOrder === "asc" ? "↑" : "↓"})`}
                  </button>
                  <button
                    onClick={() => handleSort("workspaceCount")}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${sortField === "workspaceCount" ? 'bg-muted/30' : ''}`}
                  >
                    Workspaces {sortField === "workspaceCount" && `(${sortOrder === "asc" ? "↑" : "↓"})`}
                  </button>
                  <button
                    onClick={() => handleSort("registrationDate")}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${sortField === "registrationDate" ? 'bg-muted/30' : ''}`}
                  >
                    Registration {sortField === "registrationDate" && `(${sortOrder === "asc" ? "↑" : "↓"})`}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 py-1.5 bg-background border border-gray-4300 text-foreground text-sm hover:bg-gray-2000/50 transition-colors flex items-center gap-2 rounded-md"
            >
              <Download size={14} />
              Export
              <ChevronDown size={14} className="opacity-50" />
            </button>
            
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-32 bg-background border border-gray-4300 shadow-lg rounded-md z-20">
                  <button
                    onClick={() => {
                      exportToCSV();
                      setShowExportMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => {
                      exportToJSON();
                      setShowExportMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-2000/50 transition-colors flex items-center gap-2 border-t border-gray-4300"
                  >
                    JSON
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-background border border-gray-4300 overflow-hidden rounded-lg relative">
        <div className="overflow-x-auto">
          <div className="w-full">
            <div 
              className="px-4 py-4 text-xs font-medium text-muted-foreground/60 bg-gray-2000/10 border-b border-gray-4300 text-left"
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 1.2fr 120px 120px 160px 160px 50px',
                columnGap: '16px'
              }}
            >
              <div className="flex items-center justify-center pr-4">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-4500 cursor-pointer bg-gray-4500"
                  style={mounted ? {
                    accentColor: isDark ? "#141515" : "#141515"
                  } : {}}
                  checked={paginatedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
                  onChange={handleSelectAll}
                />
              </div>
              <div className="flex items-center gap-1.5 px-4">
                <User size={14} className="opacity-40" />
                <span>{title}</span>
              </div>
              <div className="flex items-center gap-1.5 px-4">
                <Mail size={14} className="opacity-40" />
                <span>Email</span>
              </div>
              <div className="flex items-center gap-1.5 px-4">
                <Activity size={14} className="opacity-40" />
                <span>Status</span>
              </div>
              <div className="flex items-center gap-1.5 px-4">
                <Building2 size={14} className="opacity-40" />
                <span>Workspaces</span>
              </div>
              <div className="flex items-center gap-1.5 px-4">
                <Calendar size={14} className="opacity-40" />
                <span>Registered</span>
              </div>
              <div className="flex items-center gap-1.5 px-4">
                <Calendar size={14} className="opacity-40" />
                <span>Last Login</span>
              </div>
              <div className="flex items-center justify-center px-3">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="opacity-30">
                  <circle cx="8" cy="8" r="1" fill="currentColor"/>
                  <circle cx="13" cy="8" r="1" fill="currentColor"/>
                  <circle cx="3" cy="8" r="1" fill="currentColor"/>
                </svg>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`page-${currentPage}`}
                variants={shouldAnimate ? containerVariants : {}}
                initial={shouldAnimate ? "hidden" : "visible"}
                animate="visible"
              >
                {paginatedUsers.map((user) => (
                  <motion.div key={user.id} variants={shouldAnimate ? rowVariants : {}}>
                    <div
                      className={`px-4 py-4 group relative transition-all duration-150 border-b border-gray-4300 ${
                        selectedUsers.includes(user.id)
                          ? "bg-gray-2000/30" 
                          : "bg-gray-2000/5 hover:bg-gray-2000/20"
                      }`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr 1.2fr 120px 120px 160px 160px 50px',
                        columnGap: '16px',
                        alignItems: 'center'
                      }}
                    >
                      <div className="flex items-center justify-center pr-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-4500 cursor-pointer bg-gray-4500"
                          style={mounted ? {
                            accentColor: isDark ? "#141515" : "#141515"
                          } : {}}
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                        />
                      </div>

                      <div className="flex items-center gap-2 min-w-0 px-4">
                        <div className="inline-flex items-center gap-2 px-2 py-1 bg-gray-2000/30 rounded-full">
                          {(() => {
                            let initials = '';
                            if (user.name) {
                              const nameParts = user.name.trim().split(/\s+/);
                              if (nameParts.length >= 2) {
                                initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
                              } else {
                                initials = user.name[0].toUpperCase();
                              }
                            } else {
                              initials = user.email[0].toUpperCase();
                            }
                            return (
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-primary font-medium">
                                  {initials}
                                </span>
                              </div>
                            );
                          })()}
                          <div className="min-w-0">
                            <div className="text-sm text-foreground truncate">{user.name || user.email}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center min-w-0 px-4">
                        <a 
                          href={`mailto:${user.email}`}
                          className="text-sm text-blue-500 hover:text-blue-600 truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {user.email}
                        </a>
                      </div>

                      <div className="flex items-center px-4">
                        {(() => {
                          const { bgColor, textColor, dotColor } = getStatusColor(user.status);
                          return (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${bgColor} ${textColor} rounded-md capitalize`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                              {user.status}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center px-4">
                        <span className="text-sm text-foreground/80">
                          {user.workspaceCount}
                        </span>
                      </div>

                      <div className="flex items-center px-4">
                        <span className="text-sm text-muted-foreground/80">
                          {formatRelativeDate(user.registrationDate)}
                        </span>
                      </div>

                      <div className="flex items-center px-4">
                        <span className="text-sm text-muted-foreground/80">
                          {formatRelativeDate(user.lastLogin)}
                        </span>
                      </div>

                      <div className="flex items-center justify-center px-3 relative">
                        <button
                          onClick={() => setOpenDropdownUserId(openDropdownUserId === user.id ? null : user.id)}
                          className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                            <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                            <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
                          </svg>
                        </button>
                        
                        {openDropdownUserId === user.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdownUserId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-background border border-gray-4300 shadow-lg rounded-md z-20 py-1">
                              <button
                                onClick={() => {
                                  const details = getUserDetails(user);
                                  // You could open a modal or navigate to a details page here
                                  console.log('View details for:', details);
                                  setOpenDropdownUserId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-2000/50 transition-colors flex items-center gap-2"
                              >
                                <User size={14} className="opacity-60" />
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  window.location.href = `mailto:${user.email}`;
                                  setOpenDropdownUserId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-2000/50 transition-colors flex items-center gap-2"
                              >
                                <Mail size={14} className="opacity-60" />
                                Send Email
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(user.email);
                                  setOpenDropdownUserId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-2000/50 transition-colors flex items-center gap-2"
                              >
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="opacity-60">
                                  <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                                  <path d="M3 11V3C3 2.44772 3.44772 2 4 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                Copy Email
                              </button>
                              <div className="h-px bg-gray-4300 my-1" />
                              <button
                                onClick={() => {
                                  // Add delete/disable action here
                                  console.log('Delete user:', user.id);
                                  setOpenDropdownUserId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-red-500/10 text-red-400 transition-colors flex items-center gap-2"
                              >
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="opacity-60">
                                  <path d="M3 4H13M5 4V3C5 2.44772 5.44772 2 6 2H10C10.5523 2 11 2.44772 11 3V4M6 7.5V11.5M10 7.5V11.5M4 4H12L11.5 13C11.5 13.5523 11.0523 14 10.5 14H5.5C4.94772 14 4.5 13.5523 4.5 13L4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                Delete User
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="text-xs text-muted-foreground/70">
            Page {currentPage} of {totalPages} • {sortedAndFilteredUsers.length} users
          </div>
          
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-background border border-gray-4300 text-foreground text-xs hover:bg-gray-2000/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-md"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-background border border-gray-4300 text-foreground text-xs hover:bg-gray-2000/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-md"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
