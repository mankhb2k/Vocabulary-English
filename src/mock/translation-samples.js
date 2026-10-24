function sampleTimestamp(day, index) {
  const [year, month, date] = day.split('-').map(Number);
  const timestamp = new Date(year, month - 1, date, 9 + index, 8 + index * 7, 0, 0);
  return timestamp.toISOString().slice(0, 19).replace('T', ' ');
}

const samplesByDay = [
  {
    day: '2026-10-24',
    samples: [
      ['Mình vừa cập nhật giao diện trang chủ, bạn xem giúp mình nhé.', 'I’ve just updated the home page UI. Could you take a look?'],
      ['Nút này trên mobile đang bị sát mép quá.', 'This button is too close to the edge on mobile.'],
      ['Bạn có thể đổi màu nền thành xanh nhạt hơn không?', 'Could you make the background a lighter shade of blue?'],
      ['Phần loading nên giữ chiều cao cố định để tránh layout bị nhảy.', 'The loading area should keep a fixed height to prevent the layout from jumping.'],
      ['Mình sẽ kiểm tra lại trên mobile rồi gửi bạn bản cập nhật.', 'I’ll check it on mobile and send you an update.'],
    ],
  },
  {
    day: '2026-10-22',
    samples: [
      ['Mình nghĩ nên tách phần này thành một component riêng.', 'I think we should split this into a separate component.'],
      ['API đang trả về dữ liệu trùng khi tải trang lần thứ hai.', 'The API returns duplicate data when the page is loaded a second time.'],
      ['Bạn thêm trạng thái empty cho trường hợp chưa có kết quả nhé.', 'Could you add an empty state for when there are no results?'],
      ['Đừng gọi API mỗi lần người dùng gõ một ký tự.', 'Don’t call the API every time the user types a character.'],
      ['Mình đã sửa lỗi và mở pull request để review.', 'I’ve fixed the bug and opened a pull request for review.'],
    ],
  },
  {
    day: '2026-10-20',
    samples: [
      ['Câu tiếp theo là transition, favorite ở trên transition ở dưới và chúng ta chưa có nhiều transition nên chưa cần làm group giống CapCut, cứ giữ như hiện tại.', 'Next is transition. Keep favorites at the top and transitions below. We don’t have many transitions yet, so there’s no need to group them like CapCut. Keep it as it is for now.'],
      ['Câu video effect và body effect bỏ kiểu group vì chúng ta chưa có nhiều.', 'Remove the groups for video effect and body effect because we don’t have many yet.'],
      ['Phần này chỉ cần hiển thị tối đa ba mục, còn lại cho vào nút xem thêm.', 'This section only needs to show up to three items. Put the rest behind a “Show more” button.'],
      ['Khi chọn một ngày thì đóng panel và tải toàn bộ tin nhắn của ngày đó.', 'When a date is selected, close the panel and load all messages from that day.'],
      ['Giữ nguyên thứ tự tin nhắn từ cũ đến mới nhé.', 'Keep the messages in chronological order, from oldest to newest.'],
    ],
  },
  {
    day: '2026-10-17',
    samples: [
      ['Mình chưa muốn thêm animation ở bước này.', 'I don’t want to add animations at this stage.'],
      ['Hãy dùng lại icon đang có trong thư viện Lucide.', 'Please reuse an icon that’s already available in Lucide.'],
      ['Phần này cần hoạt động tốt cả khi mất kết nối.', 'This part should still work well when the connection is lost.'],
      ['Thông báo lỗi nên nói rõ người dùng cần làm gì tiếp theo.', 'The error message should clearly explain what the user needs to do next.'],
      ['Bạn kiểm tra giúp mình trường hợp dữ liệu bị thiếu nhé.', 'Could you check what happens when some data is missing?'],
    ],
  },
  {
    day: '2026-10-10',
    samples: [
      ['Xóa luôn bộ lọc này nhé.', 'Remove this filter altogether.'],
      ['Màn hình nhỏ đang bị tràn ngang.', 'The layout overflows horizontally on small screens.'],
      ['Danh sách nên cuộn độc lập, không cuộn cả trang.', 'The list should scroll independently instead of scrolling the whole page.'],
      ['Mình sẽ cập nhật nội dung sau khi chốt thiết kế.', 'I’ll update the content once we’ve finalized the design.'],
      ['Có thể giữ nút này luôn nằm ở cuối màn hình không?', 'Can we keep this button pinned to the bottom of the screen?'],
    ],
  },
];

export function createTranslationSamples() {
  return samplesByDay.flatMap(({ day, samples }) => samples.map(([sourceText, translatedText], index) => ({
    id: `demo-${day}-${index + 1}`,
    sourceText,
    translatedText,
    createdAt: sampleTimestamp(day, index),
    isMock: true,
  })));
}
