import {
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  UserPlusIcon,
  HomeIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  CheckCircleIcon,
  DocumentIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon, count: "5", current: true, role: 'all' },
  { name: "Intake Files", href: "/intake-files", icon: DocumentIcon, current: false, role: 'admin' },
  { name: "Employees", href: "/employees", icon: UserGroupIcon, current: false, role: 'admin' },
  { name: "Intake Team", href: "/intake-team", icon: UserPlusIcon, current: false, role: 'admin' },
  { name: "Profile", href: "/profile", icon: UserCircleIcon, current: false, role: 'all' },
  { name: "Completed Jobs", href: "/completed-jobs", icon: CheckCircleIcon, current: false, role: 'admin' },
  // {
  //   name: "Projects",
  //   href: "#",
  //   icon: FolderIcon,
  //   count: "12",
  //   current: false,
  // },
  // {
  //   name: "Calendar",
  //   href: "#",
  //   icon: CalendarIcon,
  //   count: "20+",
  //   current: false,
  // },
  // { name: "Documents", href: "#", icon: DocumentDuplicateIcon, current: false },
  // { name: "Reports", href: "#", icon: ChartPieIcon, current: false },
];
// const teams = [
//   { id: 1, name: "Heroicons", href: "#", initial: "H", current: false },
//   { id: 2, name: "Tailwind Labs", href: "#", initial: "T", current: false },
//   { id: 3, name: "Workcation", href: "#", initial: "W", current: false },
// ];

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
 const location = useLocation()
  async function handleLogout() {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Error during logout', error);
    }
  }

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 h-[100vh]">
      <div className="flex h-16 shrink-0 items-center"></div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
            {navigation
                .filter(item => item.role === 'all' || (currentUser && currentUser.role === 'admin' && item.role === 'admin'))
                .map((item)=> (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={classNames(
                      location.pathname === item.href
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          <li className="-mx-6 mt-auto">
            <button
              className="flex justify-center items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-white hover:bg-gray-800"
              onClick={() => handleLogout()}
            >
              Logout
              <ArrowRightOnRectangleIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
