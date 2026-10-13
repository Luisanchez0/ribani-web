/**
 * Íconos de la aplicación, tomados de reicon-react-native
 * (https://reicon.dev) y renderizados en web mediante el adaptador
 * `create-icon-web.ts` (enlazado por el plugin `reicon-web` de
 * vite.config.ts).
 *
 * Mantener las importaciones directas por archivo (`icons/X.js`) para
 * que el bundle solo incluya los íconos usados (tree-shaking).
 */
import BellAlert from 'reicon-react-native/icons/BellAlert.js'
import CallCalling from 'reicon-react-native/icons/CallCalling.js'
import ClipboardText from 'reicon-react-native/icons/ClipboardText.js'
import Home from 'reicon-react-native/icons/Home.js'
import Map2 from 'reicon-react-native/icons/Map2.js'
import Pill from 'reicon-react-native/icons/Pill.js'
import ShieldTick from 'reicon-react-native/icons/ShieldTick.js'
import UserSquare3 from 'reicon-react-native/icons/UserSquare3.js'
import UserHeart from 'reicon-react-native/icons/UserHeart.js'
import Users from 'reicon-react-native/icons/Users.js'
import Watch2 from 'reicon-react-native/icons/Watch2.js'

export {
  BellAlert as IconoAlertas,
  CallCalling as IconoContactos,
  ClipboardText as IconoAuditoria,
  Home as IconoInicio,
  Map2 as IconoUbicaciones,
  Pill as IconoMedicamentos,
  ShieldTick as IconoEscudo,
  ShieldTick as IconoZonasSeguras,
  UserHeart as IconoFamiliares,
  UserSquare3 as IconoRoles,
  Users as IconoUsuarios,
  Watch2 as IconoDispositivos,
}
