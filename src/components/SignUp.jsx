// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient("SUPABASE_URL", "SUPABASE_ANON_KEY");

// function SignUp() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [errorMessage, setErrorMessage] = useState("");
//   const navigate = useNavigate();

//   async function handleSignUp(event) {
//     event.preventDefault();
//     setErrorMessage("");

//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//     });

//     if (error) {
//       setErrorMessage(error.message);
//       return;
//     }

//     // Redirect to dashboard after successful signup
//     navigate("/");
//   }

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       <div className="bg-white p-8 rounded-lg shadow-lg w-96">
//         <h2 className="text-2xl font-bold text-center mb-4">Sign Up</h2>
//         {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}
        
//         <form onSubmit={handleSignUp}>
//           <label className="block mb-2">
//             Email:
//             <input
//               type="email"
//               className="w-full p-2 border border-gray-300 rounded mt-1"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//           </label>

//           <label className="block mb-2">
//             Password:
//             <input
//               type="password"
//               className="w-full p-2 border border-gray-300 rounded mt-1"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//           </label>

//           <button
//             type="submit"
//             className="w-full bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-600"
//           >
//             Sign Up
//           </button>
//         </form>

//         <p className="text-sm text-center mt-4">
//           Already have an account?{" "}
//           <Link to="/login" className="text-blue-500 hover:underline">
//             Log in
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }

// export default SignUp;
