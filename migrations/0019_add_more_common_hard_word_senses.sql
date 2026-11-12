UPDATE hard_words SET meaning_vi = 'cho phép; dành, chừa (thời gian, tiền)' WHERE word = 'allow';
UPDATE hard_words SET meaning_vi = 'lo lắng; nóng lòng, mong mỏi' WHERE word = 'anxious';
UPDATE hard_words SET meaning_vi = 'trân trọng; hiểu rõ, nhận thức được' WHERE word = 'appreciate';
UPDATE hard_words SET meaning_vi = 'thuộc về; cảm thấy mình thuộc về, hòa nhập' WHERE word = 'belong';
UPDATE hard_words SET meaning_vi = 'chứa; kiềm chế' WHERE word = 'contain';
UPDATE hard_words SET meaning_vi = 'sự tự tin; sự tin cậy, tin tưởng' WHERE word = 'confidence';
UPDATE hard_words SET meaning_vi = 'hậu quả; tầm quan trọng' WHERE word = 'consequence';
UPDATE hard_words SET meaning_vi = 'giấc mơ; ước mơ, hoài bão' WHERE word = 'dream';
UPDATE hard_words SET meaning_vi = 'mong đợi; cho rằng, yêu cầu' WHERE word = 'expect';
UPDATE hard_words SET meaning_vi = 'sự tập trung; trọng tâm, tiêu điểm' WHERE word = 'focus';
UPDATE hard_words SET meaning_vi = 'điểm số; cấp, lớp' WHERE word = 'grade';
UPDATE hard_words SET meaning_vi = 'quản lý; xoay sở thành công' WHERE word = 'manage';
UPDATE hard_words SET meaning_vi = 'trí nhớ; ký ức' WHERE word = 'memory';
UPDATE hard_words SET meaning_vi = 'nếu không; theo cách khác' WHERE word = 'otherwise';
UPDATE hard_words SET meaning_vi = 'được yêu thích, ưa chuộng; phổ biến' WHERE word = 'popular';
UPDATE hard_words SET part_of_speech = 'Verb / Noun', meaning_vi = 'hứa; lời hứa, triển vọng' WHERE word = 'promise';
UPDATE hard_words SET meaning_vi = 'trì hoãn; làm mất hứng, khiến không muốn' WHERE word = 'put off';
UPDATE hard_words SET meaning_vi = 'nên; đáng lẽ, theo dự kiến' WHERE word = 'should';
UPDATE hard_words SET meaning_vi = 'tiêu chuẩn; mức thông thường' WHERE word = 'standard';
UPDATE hard_words SET meaning_vi = 'đề xuất; ngụ ý, cho thấy' WHERE word = 'suggest';
UPDATE hard_words SET meaning_vi = 'tin tưởng; trông cậy vào' WHERE word = 'trust';
UPDATE hard_words SET part_of_speech = 'Verb / Noun', meaning_vi = 'tự hỏi; kinh ngạc, trầm trồ' WHERE word = 'wonder';
UPDATE hard_words SET part_of_speech = 'Adjective / Noun', meaning_vi = 'kiên nhẫn; bệnh nhân' WHERE word = 'patient';
UPDATE hard_words SET part_of_speech = 'Conjunction / Preposition', meaning_vi = 'nhưng; ngoại trừ' WHERE word = 'but';

INSERT OR IGNORE INTO hard_word_examples (word, position, english, vietnamese) VALUES
  ('allow', 6, 'Please allow ten minutes for the walk to the station.', 'Hãy dành khoảng mười phút để đi bộ đến nhà ga.'),
  ('anxious', 6, 'She is anxious to hear the final results.', 'Cô ấy nóng lòng muốn biết kết quả cuối cùng.'),
  ('appreciate', 6, 'I appreciate how much work went into this project.', 'Tôi hiểu dự án này đã tốn nhiều công sức đến mức nào.'),
  ('belong', 6, 'After a few weeks, he felt that he belonged to the team.', 'Sau vài tuần, anh ấy cảm thấy mình hòa nhập với cả nhóm.'),
  ('contain', 6, 'She took a deep breath to contain her anger.', 'Cô ấy hít sâu để kiềm chế cơn giận.'),
  ('confidence', 6, 'I have confidence in her judgment.', 'Tôi tin tưởng vào sự phán đoán của cô ấy.'),
  ('consequence', 6, 'The small mistake was of little consequence.', 'Lỗi nhỏ đó không mấy quan trọng.'),
  ('dream', 6, 'Her dream is to open a small bakery.', 'Ước mơ của cô ấy là mở một tiệm bánh nhỏ.'),
  ('expect', 6, 'The manager expects everyone to arrive on time.', 'Quản lý yêu cầu mọi người đến đúng giờ.'),
  ('focus', 6, 'The main focus of the meeting is customer service.', 'Trọng tâm chính của cuộc họp là dịch vụ khách hàng.'),
  ('grade', 6, 'My daughter is in the fifth grade.', 'Con gái tôi đang học lớp năm.'),
  ('manage', 6, 'We managed to catch the last train.', 'Chúng tôi đã xoay sở để kịp chuyến tàu cuối cùng.'),
  ('memory', 6, 'He has a very clear memory of that day.', 'Anh ấy nhớ rất rõ về ngày hôm đó.'),
  ('otherwise', 6, 'The two plans are similar but otherwise quite different.', 'Hai kế hoạch giống nhau ở điểm đó nhưng khác hẳn ở những mặt còn lại.'),
  ('otherwise', 7, 'Leave now; otherwise, you may miss the bus.', 'Đi ngay đi; nếu không, có thể bạn sẽ lỡ xe buýt.'),
  ('popular', 6, 'This app is popular with university students.', 'Ứng dụng này được sinh viên đại học ưa chuộng.'),
  ('promise', 6, 'The young player shows great promise.', 'Cầu thủ trẻ này cho thấy nhiều triển vọng.'),
  ('put off', 6, 'The smell of smoke put her off her dinner.', 'Mùi khói khiến cô ấy mất ngon.'),
  ('should', 6, 'You should have called me earlier.', 'Đáng lẽ bạn nên gọi cho tôi sớm hơn.'),
  ('standard', 6, 'The hotel is above the usual standard for this price.', 'Khách sạn có tiêu chuẩn cao hơn mức thường thấy ở tầm giá này.'),
  ('suggest', 6, 'The evidence suggests that the plan worked.', 'Bằng chứng cho thấy kế hoạch đã có hiệu quả.'),
  ('trust', 6, 'I trust him to keep this information private.', 'Tôi tin anh ấy sẽ giữ kín thông tin này.'),
  ('wonder', 6, 'The children wondered at the bright fireworks.', 'Bọn trẻ trầm trồ trước màn pháo hoa rực rỡ.'),
  ('patient', 6, 'The doctor spoke with the patient for a few minutes.', 'Bác sĩ trò chuyện với bệnh nhân vài phút.'),
  ('but', 6, 'Everyone but Anna was ready to leave.', 'Mọi người ngoại trừ Anna đều đã sẵn sàng rời đi.');
