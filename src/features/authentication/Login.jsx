import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="mt-auto">
      <Link
        to="/login"
        className="w-full flex items-center justify-center p-3 bg-purple-500 text-gray-100 rounded-lg hover:bg-purple-400"
      ></Link>
      <div className="text-center text-black mt-4">
        or
        <a href="" className="ml-2 text-purple-800 underline">
          sign up
        </a>
      </div>
    </div>
  );
}

export default Login;
