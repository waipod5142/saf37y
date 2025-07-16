interface Choice {
  value: string;
  text: string;
  colorClass: string;
}

// Choice arrays for different countries
export const vn: Choice[] = [
  { value: 'Pass', text: 'Đã có', colorClass: 'bg-green-500' },
  { value: 'NotPass', text: 'Chưa có', colorClass: 'bg-rose-500' },
  { value: 'N/A', text: 'Không áp', colorClass: 'bg-yellow-500' },
];

export const lk: Choice[] = [
  { value: 'Pass', text: 'ඇත', colorClass: 'bg-green-500' },
  { value: 'NotPass', text: 'නැත', colorClass: 'bg-rose-500' },
  { value: 'N/A', text: 'අදාල නැත', colorClass: 'bg-yellow-500' },
];

export const bd: Choice[] = [
  { value: 'Pass', text: 'পাস', colorClass: 'bg-green-500' },
  { value: 'NotPass', text: 'পাস নয়', colorClass: 'bg-rose-500' },
  { value: 'N/A', text: 'প্রযোজ্য নয়', colorClass: 'bg-yellow-500' },
];

export const cmic: Choice[] = [
  { value: 'Pass', text: 'ប្រក្រតី', colorClass: 'bg-green-500' },
  { value: 'NotPass', text: 'មិនប្រក្រតី', colorClass: 'bg-rose-500' },
  { value: 'N/A', text: 'មិនពាក់ព័ន្ធ', colorClass: 'bg-yellow-500' },
];

export const th: Choice[] = [
  { value: 'Pass', text: 'ผ่าน', colorClass: 'bg-green-500' },
  { value: 'NotPass', text: 'ไม่ผ่าน', colorClass: 'bg-rose-500' },
  { value: 'N/A', text: 'ไม่เกี่ยวข้อง', colorClass: 'bg-yellow-500' },
];

// Translation objects for different languages
export const inspector: { [key: string]: string } = {
  vn: "Người kiểm tra",
  lk: "Inspector",
  bd: "Inspector",
  cmic: "អ្នកត្រួតពិនិត្យ",
  jkcement: "Inspector",
  th: "ผู้ตรวจสอบ",
};

export const howto: { [key: string]: string } = {
  vn: "Cách kiểm tra",
  lk: "How to check",
  bd: "How to check",
  cmic: "របៀបត្រួតពិនិត្យ",
  jkcement: "How to check",
  th: "วิธีการตรวจสอบ",
};

export const accept: { [key: string]: string } = {
  vn: "Tiêu chuẩn chấp nhận",
  lk: "Acceptance criteria",
  bd: "Acceptance criteria",
  cmic: "លក្ខណៈវិនិច្ឆ័យការទទួលយក",
  jkcement: "Acceptance criteria",
  th: "เกณฑ์การผ่าน",
};

export const remarkr: { [key: string]: string } = {
  vn: "Ghi chú bắt buộc",
  lk: "Required remark",
  bd: "Required remark",
  cmic: "កំណត់ចំណាំចាំបាច់",
  jkcement: "Required remark",
  th: "หมายเหตุที่จำเป็น",
};

export const remark: { [key: string]: string } = {
  vn: "Ghi chú",
  lk: "Remark",
  bd: "Remark",
  cmic: "កំណត់ចំណាំ",
  jkcement: "Remark",
  th: "หมายเหตุ",
};

export const picture: { [key: string]: string } = {
  vn: "Đính kèm hình ảnh",
  lk: "Attach image",
  bd: "Attach image",
  cmic: "ភ្ជាប់រូបភាព",
  jkcement: "Attach image",
  th: "แนบรูปภาพ",
};

export const submit: { [key: string]: string } = {
  vn: "Gửi",
  lk: "Submit",
  bd: "Submit",
  cmic: "ដាក់ស្នើ",
  jkcement: "Submit",
  th: "ส่ง",
};