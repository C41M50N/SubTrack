import dayjs from "dayjs";
import RelativeTime from 'dayjs/plugin/relativeTime'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(LocalizedFormat)
dayjs.extend(RelativeTime)

export default dayjs
