import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

export default function AppDrawerContent() {
  const options = [
    "Rules", // View, add, or edit website lock/block/redirect rules.
    "Profiles", // Manage or switch between profiles (Work, Focus, Kids, Personal).
    "Import / Export", // Backup or restore all extension data.
    "Settings", // General extension settings (e.g., password, security, logs).
    "About", // Info about Link Lock, version, and help.
  ];
  return (
    <SheetContent side="left">
      <SheetHeader>
        <SheetTitle>Link Lock Menu</SheetTitle>
        <SheetDescription>
          Quickly access profiles, rules, settings, and more. Choose an option
          to manage your privacy and website controls.
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-4 mt-6">
        <ul className="flex flex-col gap-2 mt-6">
          {options.map((option) => (
            <li
              key={option}
              className="w-full px-4 py-2 rounded hover:bg-gray-100 cursor-pointer text-left transition hover:text-black"
            >
              {option}
            </li>
          ))}
        </ul>
      </div>
    </SheetContent>
  );
}
