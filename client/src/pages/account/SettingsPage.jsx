import { useSelector } from "react-redux";

import { selectUser } from "../../features/auth/authSelector";
import AccountSettings from "../../components/account/AccountSettings";

export default function SettingsPage() {
  const user = useSelector(selectUser);

  return <AccountSettings user={user} />;
}
