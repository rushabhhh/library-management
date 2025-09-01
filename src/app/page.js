"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
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

// Demo books with available count and description
const initialBooks = [
  {
    id: 1,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Help",
    description: "A practical guide to building good habits and breaking bad ones, with actionable strategies for lasting change.",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80",
    available: 3,
    total: 5,
  },
  {
    id: 2,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Classic",
    description: "A classic novel set in the Roaring Twenties, exploring themes of wealth, love, and the American Dream.",
    image: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=400&q=80",
    available: 2,
    total: 2,
  },
  {
    id: 3,
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Programming",
    description: "A handbook of agile software craftsmanship, teaching principles and best practices for writing clean code.",
    image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80",
    available: 1,
    total: 3,
  },
  {
    id: 4,
    title: "Harry Potter",
    author: "J.K. Rowling",
    category: "Fantasy",
    description: "The magical journey of a young wizard and his friends at Hogwarts School of Witchcraft and Wizardry.",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    available: 0,
    total: 1,
  },
  {
    id: 5,
    title: "The Lean Startup",
    author: "Eric Ries",
    category: "Business",
    description: "A methodology for developing businesses and products, focusing on fast iteration and validated learning.",
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=400&q=80",
    available: 2,
    total: 5,
  },
];

const categories = [
  "All",
  ...Array.from(new Set(initialBooks.map((b) => b.category))),
];

// LocalStorage helpers for borrow state
function getBorrowed(username) {
  if (!username) return [];
  const data = localStorage.getItem(`user_${username}_borrowed`);
  return data ? JSON.parse(data) : [];
}
function setBorrowed(username, arr) {
  if (!username) return;
  localStorage.setItem(`user_${username}_borrowed`, JSON.stringify(arr));
}
function getBooksState() {
  const data = localStorage.getItem("books_state");
  return data ? JSON.parse(data) : initialBooks;
}
function setBooksState(arr) {
  localStorage.setItem("books_state", JSON.stringify(arr));
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [username, setUsername] = useState(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [books, setBooks] = useState(initialBooks);
  const [borrowed, setBorrowedState] = useState([]);
  const router = useRouter();

  useEffect(() => {
    setUsername(getCookie("session"));
    setBooks(getBooksState());
    if (getCookie("session")) {
      setBorrowedState(getBorrowed(getCookie("session")));
    }
  }, []);

  // Update books state in localStorage when books change
  useEffect(() => {
    setBooksState(books);
  }, [books]);

  // Update borrowed state in localStorage when borrowed changes
  useEffect(() => {
    if (username) setBorrowed(username, borrowed);
  }, [borrowed, username]);

  const filteredBooks = books.filter((book) => {
    const matchesCategory =
      selectedCategory === "All" || book.category === selectedCategory;
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function handleBookAction(e) {
    if (!username) {
      e.preventDefault();
      setShowLoginPopup(true);
    }
  }

  function handleBorrow(bookId, e) {
    e.stopPropagation();
    if (!username) {
      setShowLoginPopup(true);
      return;
    }
    if (borrowed.includes(bookId)) {
      alert("You already borrowed this book.");
      return;
    }
    const idx = books.findIndex((b) => b.id === bookId);
    if (idx === -1 || books[idx].available < 1) {
      alert("Book not available.");
      return;
    }
    // Decrease available count
    const updatedBooks = books.map((b, i) =>
      i === idx ? { ...b, available: b.available - 1 } : b
    );
    setBooks(updatedBooks);
    setBorrowedState([...borrowed, bookId]);
    alert("Book borrowed! Check your dashboard for details.");
  }

  function handleBookClick(bookId) {
    router.push(`/book/${bookId}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-800">Library System</span>
        </div>
        <nav className="flex gap-8">
          <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition">Catalog</Link>
          <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium transition">Dashboard</Link>
        </nav>
        <div>
          {username ? (
            <span className="text-gray-600 font-medium">Hello, {username}</span>
          ) : (
            <a
              href="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition"
            >
              Login
            </a>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-blue-100 to-blue-200 py-16 px-4 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4">
            Welcome to Your <span className="text-blue-600">Library</span> Management System
          </h1>
          <p className="text-lg text-blue-800 mb-6">
            Discover, borrow, and read books online. Manage your loans, reservations, and fines with a modern, easy-to-use dashboard.
          </p>
          <div className="flex gap-4">
            <a
              href="#books"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
            >
              Browse Books
            </a>
            <a
              href="/dashboard"
              className="bg-white border border-blue-600 text-blue-700 px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-50 transition"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <img
            src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=500&q=80"
            alt="Library Hero"
            className="rounded-xl shadow-lg w-full max-w-md"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Why Use Our Library System?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-lg p-6 flex flex-col items-center text-center shadow">
              <Image src="/book.svg" alt="Books" width={40} height={40} className="mb-2" />
              <h3 className="font-semibold text-lg mb-2 text-blue-800">Easy Book Management</h3>
              <p className="text-gray-600">Browse, search, and categorize books in seconds. Keep your collection organized and accessible.</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 flex flex-col items-center text-center shadow">
              <svg width="40" height="40" fill="none" className="mb-2" viewBox="0 0 24 24"><path d="M12 6v6l4 2" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/></svg>
              <h3 className="font-semibold text-lg mb-2 text-blue-800">Track Loans & Fines</h3>
              <p className="text-gray-600">Borrow, return, renew, and reserve books. The system tracks due dates, availability, and fines.</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 flex flex-col items-center text-center shadow">
              <svg width="40" height="40" fill="none" className="mb-2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2"/></svg>
              <h3 className="font-semibold text-lg mb-2 text-blue-800">Read Online</h3>
              <p className="text-gray-600">View free books in-browser with our PDF reader. Upload your own PDFs for development and seeding.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Login Popup */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-xs w-full text-center">
            <div className="mb-4 text-lg font-semibold text-gray-800">Please login to continue</div>
            <a
              href="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition inline-block"
            >
              Go to Login
            </a>
            <button
              className="block mt-4 text-gray-500 hover:underline mx-auto"
              onClick={() => setShowLoginPopup(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Featured Books Section */}
      <div className="flex flex-1" id="books">
        <main className="flex-1 flex flex-col items-center px-4 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Featured Books</h2>
          <p className="text-md text-gray-600 mb-6 text-center max-w-xl">
            Search and filter books by title, author, or category.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl mb-8">
            <input
              type="text"
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-black rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black text-black placeholder:text-gray-700 font-semibold"
              style={{ background: "#fff" }}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-black rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black text-black font-semibold"
              style={{ background: "#fff" }}
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl">
            {filteredBooks.length === 0 && (
              <div className="col-span-full text-gray-500 text-center">No books found.</div>
            )}
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-xl shadow-lg p-5 flex flex-col items-center cursor-pointer transition hover:shadow-2xl border border-gray-200"
                onClick={() => handleBookClick(book.id)}
                tabIndex={0}
                role="button"
                onKeyDown={e => { if (e.key === "Enter") handleBookClick(book.id); }}
                style={{ minHeight: 420 }}
              >
                <img
                  src={book.image}
                  alt={book.title}
                  className="w-32 h-44 object-cover rounded mb-4 shadow"
                  loading="lazy"
                  style={{ boxShadow: "0 4px 16px 0 rgba(0,0,0,0.08)" }}
                />
                <div className="font-bold text-lg text-gray-900 mb-1 text-center">{book.title}</div>
                <div className="text-gray-700 text-sm mb-1">{book.author}</div>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs mb-2">{book.category}</span>
                <div className="text-xs mb-2 text-gray-700 italic text-center">{book.description}</div>
                <div className="text-xs mb-2 font-semibold">
                  <span className={book.available > 0 ? "text-green-700" : "text-red-600"}>
                    {book.available}
                  </span>
                  <span className="text-gray-700"> / {book.total} available</span>
                </div>
                <div className="flex gap-2 mt-2 w-full justify-center">
                  <button
                    className={`px-5 py-2 rounded font-semibold transition border border-black
                      ${book.available > 0 && !borrowed.includes(book.id)
                        ? "bg-black text-white hover:bg-gray-900"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    disabled={book.available < 1 || borrowed.includes(book.id)}
                    onClick={(e) => handleBorrow(book.id, e)}
                    tabIndex={-1}
                    style={{ order: 2 }}
                  >
                    {borrowed.includes(book.id)
                      ? "Borrowed"
                      : book.available > 0
                      ? "Borrow"
                      : "Not Available"}
                  </button>
                  <button
                    className="px-5 py-2 rounded font-semibold border border-black bg-white text-black hover:bg-gray-100 transition"
                    onClick={e => {
                      e.stopPropagation();
                      // Always open the same demo PDF
                      window.open("public/books/demoBook.pdf", "_blank");
                    }}
                    tabIndex={-1}
                    style={{ order: 3 }}
                  >
                    Read
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* About Section */}
      <section className="w-full py-12 px-4 bg-blue-50 mt-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center">About Our Library System</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border border-gray-200">
              <span className="text-3xl mb-3">💡</span>
              <div className="font-semibold text-blue-800 mb-2 text-lg">Modern & Responsive</div>
              <div className="text-gray-600 text-sm">
                Enjoy a clean, modern interface that works great on any device. Fast search and filtering make finding books easy.
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border border-gray-200">
              <span className="text-3xl mb-3">🔒</span>
              <div className="font-semibold text-blue-800 mb-2 text-lg">Privacy & Security</div>
              <div className="text-gray-600 text-sm">
                Your session and data are stored locally for privacy. Only you can view your loans, reservations, and fines.
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border border-gray-200">
              <span className="text-3xl mb-3">📚</span>
              <div className="font-semibold text-blue-800 mb-2 text-lg">Borrowing Policy</div>
              <div className="text-gray-600 text-sm">
                Borrow up to 3 books at a time for 14 days each. Renew once if not reserved by another user.
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border border-gray-200">
              <span className="text-3xl mb-3">⏰</span>
              <div className="font-semibold text-blue-800 mb-2 text-lg">Late Returns & Fines</div>
              <div className="text-gray-600 text-sm">
                Late returns incur a Rs.5 per day fine. Please return or renew books on time to avoid penalties.
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border border-gray-200">
              <span className="text-3xl mb-3">🔖</span>
              <div className="font-semibold text-blue-800 mb-2 text-lg">Reservations</div>
              <div className="text-gray-600 text-sm">
                Reserve books that are checked out. You’ll be notified when your reserved book becomes available.
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center border border-gray-200">
              <span className="text-3xl mb-3">🖥️</span>
              <div className="font-semibold text-blue-800 mb-2 text-lg">Read Online</div>
              <div className="text-gray-600 text-sm">
                Read free books in-browser with our PDF reader. Upload your own PDFs for development and seeding.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white border-t py-6 mt-8 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Library Management System. All rights reserved.
      </footer>
    </div>
  );
}
