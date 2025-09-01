"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Cookie helpers
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Demo books (should match catalog)
const demoBooks = [
  {
    id: 1,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Help",
    available: true,
    pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    id: 2,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Classic",
    available: true,
    pdf: "",
  },
  {
    id: 3,
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Programming",
    available: true,
    pdf: "",
  },
  {
    id: 4,
    title: "Harry Potter",
    author: "J.K. Rowling",
    category: "Fantasy",
    available: true,
    pdf: "",
  },
  {
    id: 5,
    title: "The Lean Startup",
    author: "Eric Ries",
    category: "Business",
    available: true,
    pdf: "",
  },
];

// LocalStorage helpers for dashboard state
function getUserData(username) {
  if (!username) return null;
  const data = localStorage.getItem(`user_${username}_dashboard`);
  return data
    ? JSON.parse(data)
    : {
        loans: [],
        reservations: [],
        fines: [],
      };
}

function setUserData(username, data) {
  if (!username) return;
  localStorage.setItem(`user_${username}_dashboard`, JSON.stringify(data));
}

// Fine calculation (simple: $1 per day late)
function calculateFine(dueDate) {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

// Get borrowed book ids from localStorage (from landing page)
function getBorrowed(username) {
  if (!username) return [];
  const data = localStorage.getItem(`user_${username}_borrowed`);
  return data ? JSON.parse(data) : [];
}

// Razorpay API keys (from .env.local)
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ""; // Not used on frontend

// Razorpay payment handler
function payWithRazorpay(amount, onSuccess) {
  if (typeof window === "undefined") return;
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amount * 100,
    currency: "INR",
    name: "Library Fine Payment",
    description: "Pay your library fine",
    handler: function (response) {
      onSuccess(response);
    },
    prefill: {
      name: "Library User",
      email: "user@example.com",
    },
    theme: {
      color: "#2563eb",
    },
  };
  const rzp = new window.Razorpay(options);
  rzp.open();
}

export default function Dashboard() {
  const [username, setUsername] = useState(null);
  const [userData, setUserDataState] = useState({ loans: [], reservations: [], fines: [] });
  const [books, setBooks] = useState(demoBooks);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const router = useRouter();

  // Sync borrowed books from landing page (page.js)
  useEffect(() => {
    const user = getCookie("session");
    setUsername(user);

    if (user) {
      // Get borrowed book ids from landing page
      const borrowedIds = getBorrowed(user);

      // Get dashboard data
      let data = getUserData(user);

      // Add new loans for any borrowed books not already in dashboard loans
      let loans = Array.isArray(data.loans) ? [...data.loans] : [];
      let changed = false;
      borrowedIds.forEach((bookId) => {
        // Only add if not already in loans (active or returned)
        if (!loans.some(l => l.bookId === bookId)) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 14);
          loans.push({
            bookId,
            borrowedAt: new Date().toISOString(),
            dueDate: dueDate.toISOString(),
            returned: false,
            renewed: false,
          });
          changed = true;
        }
      });

      // Add a coded fine for demo (if not already present)
      if (!data.fines.some(f => f.bookId === 3 && !f.paid)) {
        data.fines.push({
          bookId: 3,
          amount: 5,
          paid: false,
          returnedAt: new Date().toISOString(),
        });
        changed = true;
      }

      if (changed) {
        data.loans = loans;
        setUserData(user, data);
      }

      setUserDataState(data);
    }
  }, []);

  // Load Razorpay script
  useEffect(() => {
    if (typeof window === "undefined" || window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  function returnBook(bookId) {
    if (!username) return;
    const loan = userData.loans.find(l => l.bookId === bookId && !l.returned);
    if (!loan) return;

    // Fine calculation
    const fineAmount = calculateFine(loan.dueDate);

    // Update loan
    const newLoans = userData.loans.map(l =>
      l.bookId === bookId && !l.returned ? { ...l, returned: true, returnedAt: new Date().toISOString() } : l
    );

    // Add fine if any
    let fines = [...userData.fines];
    if (fineAmount > 0) {
      fines.push({
        bookId,
        amount: fineAmount,
        paid: false,
        returnedAt: new Date().toISOString(),
      });
    }

    setUserDataState({ ...userData, loans: newLoans, fines });
    setUserData(username, { ...userData, loans: newLoans, fines });

    // Remove from borrowed list in localStorage (landing page)
    const borrowedIds = getBorrowed(username).filter(id => id !== bookId);
    localStorage.setItem(`user_${username}_borrowed`, JSON.stringify(borrowedIds));

    alert(fineAmount > 0 ? `Returned! Fine: $${fineAmount}` : "Returned successfully!");
  }

  function readBook() {
    // Always open the same demo PDF, no book id needed
    window.open("/books/demoBook.pdf", "_blank");
  }

  // Renew book: allow up to 3 times, only if not returned
  function renewBook(bookId) {
    if (!username) return;
    const loan = userData.loans.find(l => l.bookId === bookId && !l.returned);
    if (!loan) return;

    // Count renewals, default to 0 if undefined
    const renewCount = loan.renewCount || 0;
    if (renewCount >= 3) {
      alert("Renewal limit reached (3 times).");
      return;
    }

    // Extend due date by 7 days
    const newDueDate = new Date(loan.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 7);

    const newLoans = userData.loans.map(l =>
      l.bookId === bookId && !l.returned
        ? { ...l, dueDate: newDueDate.toISOString(), renewCount: renewCount + 1 }
        : l
    );

    setUserDataState({ ...userData, loans: newLoans });
    setUserData(username, { ...userData, loans: newLoans });
    alert("Book renewed for 7 more days!");
  }

  // Pay fine using Razorpay
  function payFine(idx) {
    const fine = userData.fines[idx];
    if (!fine || fine.paid) return;
    if (!razorpayLoaded) {
      alert("Payment gateway not loaded. Please try again.");
      return;
    }
    payWithRazorpay(fine.amount, () => {
      // Mark fine as paid
      const newFines = userData.fines.map((f, i) =>
        i === idx ? { ...f, paid: true, paidAt: new Date().toISOString() } : f
      );
      setUserDataState({ ...userData, fines: newFines });
      setUserData(username, { ...userData, fines: newFines });
      alert("Fine paid successfully!");
    });
  }

  // Fine stats
  const pendingFines = userData.fines.filter(f => !f.paid);
  const totalPending = pendingFines.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = userData.fines.filter(f => f.paid).reduce((sum, f) => sum + (f.amount || 0), 0);

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-2xl font-bold mb-4">Please login to view your dashboard.</h2>
          <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e0e7ef] py-8 px-2 md:px-6">
      {/* Header */}
      <header className="bg-white shadow flex items-center justify-between px-6 md:px-10 py-4 mb-10 rounded-xl">
        <div className="flex items-center gap-3">
          {/* <Image src="/book.svg" alt="Library Logo" width={32} height={32} /> */}
          <span className="text-2xl font-bold text-gray-800">Library System</span>
        </div>
        <nav className="flex gap-8">
          <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition">Catalog</Link>
          <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition">Dashboard</Link>
        </nav>
        <div>
          <span className="text-gray-600 font-medium">Hello, {username}</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto text-left">
        <h1 className="text-3xl font-extrabold mb-8 text-blue-900 tracking-tight">Your Dashboard</h1>
        {/* Active Loans */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-green-800 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              Active Loans
            </h2>
          </div>
          {userData.loans.filter(l => !l.returned).length === 0 ? (
            <div className="text-gray-400 py-8 bg-white rounded-xl shadow">No active loans.</div>
          ) : (
            <div className="flex flex-col gap-6">
              {userData.loans.filter(l => !l.returned).map((loan, idx) => {
                const book = books.find(b => b.id === loan.bookId);
                const fine = calculateFine(loan.dueDate);
                const renewCount = loan.renewCount || 0;
                return (
                  <div
                    key={loan.bookId + "_" + loan.borrowedAt}
                    className="bg-white border border-green-200 rounded-xl shadow-md p-6 flex flex-col gap-2 hover:shadow-lg transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-16 bg-gray-100 rounded shadow-inner flex items-center justify-center">
                        <span className="text-3xl text-green-400">📗</span>
                      </div>
                      <div>
                        <div className="font-bold text-green-900 text-lg">{book?.title}</div>
                        <div className="text-green-800 text-sm">{book?.author}</div>
                        <div className="text-xs text-green-700">{book?.category}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="text-sm text-gray-700">
                        <span className="font-semibold">Due:</span> {new Date(loan.dueDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold">Renewals:</span> {renewCount} / 3
                      </div>
                      {fine > 0 && (
                        <div className="text-red-600 text-sm font-semibold">Overdue! Fine: ₹{fine}</div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 font-semibold shadow"
                        onClick={() => returnBook(loan.bookId)}
                      >
                        Return
                      </button>
                      <button
                        className={`px-4 py-1 rounded font-semibold border ${
                          renewCount < 3
                            ? "bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-600"
                            : "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                        }`}
                        onClick={() => renewBook(loan.bookId)}
                        disabled={renewCount >= 3}
                      >
                        Renew
                      </button>
                      {book?.pdf && (
                        <button
                          className="bg-gray-800 text-white px-4 py-1 rounded hover:bg-gray-900 font-semibold"
                          onClick={readBook}
                        >
                          Read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {/* Fines */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-red-800 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
              Fines
            </h2>
            <div className="flex flex-col items-end gap-1">
              <div className="text-sm text-red-700 font-semibold">
                Pending: ₹{totalPending}
              </div>
              <div className="text-sm text-green-700 font-semibold">
                Paid: ₹{totalPaid}
              </div>
            </div>
          </div>
          {userData.fines.length === 0 ? (
            <div className="text-gray-400 py-8 bg-white rounded-xl shadow">No fines.</div>
          ) : (
            <div className="flex flex-col gap-6">
              {userData.fines.map((fine, idx) => {
                const book = books.find(b => b.id === fine.bookId);
                return (
                  <div
                    key={idx}
                    className={`rounded-xl shadow-md p-6 flex flex-col gap-2 border ${
                      fine.paid
                        ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                        : "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                    } hover:shadow-lg transition`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-16 bg-gray-100 rounded shadow-inner flex items-center justify-center">
                        <span className="text-3xl text-red-400">💸</span>
                      </div>
                      <div>
                        <div className={`font-bold text-lg ${fine.paid ? "text-green-900" : "text-red-900"}`}>
                          {book?.title}
                        </div>
                        <div className={`text-sm ${fine.paid ? "text-green-800" : "text-red-800"}`}>{book?.author}</div>
                        <div className={`text-xs ${fine.paid ? "text-green-700" : "text-red-700"}`}>{book?.category}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="text-sm text-gray-700">
                        Returned: <span className="font-semibold">{new Date(fine.returnedAt).toLocaleDateString()}</span>
                      </div>
                      <div className={`font-bold text-lg ${fine.paid ? "text-green-700" : "text-red-700"}`}>
                        Fine: ₹{fine.amount}
                      </div>
                    </div>
                    {!fine.paid ? (
                      <button
                        className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 font-semibold w-max shadow"
                        onClick={() => payFine(idx)}
                      >
                        Pay Now
                      </button>
                    ) : (
                      <div className="text-green-700 font-semibold mt-2">
                        Paid on {new Date(fine.paidAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {/* Borrowed Books List */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-500"></span>
            All Borrowed Books
          </h2>
          {userData.loans.length === 0 ? (
            <div className="text-gray-400 py-8 bg-white rounded-xl shadow">No borrowed books yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userData.loans.map(loan => {
                const book = books.find(b => b.id === loan.bookId);
                return (
                  <div
                    key={loan.bookId + "_" + loan.borrowedAt}
                    className={`rounded-xl shadow-md p-6 flex flex-col gap-2 border ${
                      loan.returned
                        ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300"
                        : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                    } hover:shadow-lg transition`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-16 bg-gray-100 rounded shadow-inner flex items-center justify-center">
                        <span className="text-3xl text-blue-400">📘</span>
                      </div>
                      <div>
                        <div className={`font-bold text-lg mb-1 ${loan.returned ? "text-gray-800" : "text-green-900"}`}>{book?.title}</div>
                        <div className={`text-sm mb-1 ${loan.returned ? "text-gray-600" : "text-green-800"}`}>{book?.author}</div>
                        <div className={`text-xs mb-1 ${loan.returned ? "text-gray-500" : "text-green-700"}`}>{book?.category}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-700 mt-2">
                      Borrowed: {new Date(loan.borrowedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs mt-1">
                      {loan.returned
                        ? <span className="text-gray-700 font-semibold">Returned</span>
                        : <span className="text-green-700 font-semibold">Active</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}