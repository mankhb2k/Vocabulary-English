UPDATE hard_words SET part_of_speech = 'Preposition / Adverb', meaning_vi = 'về, liên quan đến; khoảng, xấp xỉ' WHERE word = 'about';
UPDATE hard_words SET meaning_vi = 'thừa nhận; cho phép vào' WHERE word = 'admit';
UPDATE hard_words SET meaning_vi = 'lợi ích; phúc lợi, trợ cấp' WHERE word = 'benefit';
UPDATE hard_words SET meaning_vi = 'cơ hội; khả năng, xác suất' WHERE word = 'chance';
UPDATE hard_words SET meaning_vi = 'thay đổi; đổi tiền hoặc đổi lấy thứ khác' WHERE word = 'change';
UPDATE hard_words SET meaning_vi = 'phổ biến; chung, dùng chung' WHERE word = 'common';
UPDATE hard_words SET meaning_vi = 'cân nhắc; coi, xem là' WHERE word = 'consider';
UPDATE hard_words SET meaning_vi = 'đối phó với; đề cập đến, bàn về' WHERE word = 'deal with';
UPDATE hard_words SET meaning_vi = 'bằng cấp; mức độ, độ' WHERE word = 'degree';
UPDATE hard_words SET meaning_vi = 'thất bại; trượt bài thi' WHERE word = 'fail';
UPDATE hard_words SET meaning_vi = 'cảm thấy; sờ, cảm nhận bằng tay' WHERE word = 'feel';
UPDATE hard_words SET meaning_vi = 'trở nên; nhận được; hiểu' WHERE word = 'get';
UPDATE hard_words SET meaning_vi = 'từ bỏ, bỏ cuộc; đầu hàng' WHERE word = 'give up';
UPDATE hard_words SET meaning_vi = 'xử lý; cầm, nắm' WHERE word = 'handle';
UPDATE hard_words SET meaning_vi = 'vấn đề, sự cố; số phát hành (báo, tạp chí)' WHERE word = 'issue';
UPDATE hard_words SET part_of_speech = 'Adjective / Verb', meaning_vi = 'cuối cùng; kéo dài, dùng được trong một khoảng thời gian' WHERE word = 'last';
UPDATE hard_words SET meaning_vi = 'có nghĩa là; định, có ý muốn nói' WHERE word = 'mean';
UPDATE hard_words SET part_of_speech = 'Noun / Verb', meaning_vi = 'tâm trí, ý kiến; phiền, ngại' WHERE word = 'mind';
UPDATE hard_words SET meaning_vi = 'hiện tại; món quà' WHERE word = 'present';
UPDATE hard_words SET meaning_vi = 'áp lực; sức ép vật lý' WHERE word = 'pressure';
UPDATE hard_words SET meaning_vi = 'sự thăng chức; khuyến mãi, sự quảng bá' WHERE word = 'promotion';
UPDATE hard_words SET meaning_vi = 'chất lượng; phẩm chất, đặc tính' WHERE word = 'quality';
UPDATE hard_words SET meaning_vi = 'nhận ra; thực hiện, biến thành hiện thực' WHERE word = 'realize';
UPDATE hard_words SET meaning_vi = 'lý do; lý trí, khả năng suy luận' WHERE word = 'reason';
UPDATE hard_words SET part_of_speech = 'Noun / Verb', meaning_vi = 'kết quả, hệ quả; dẫn đến' WHERE word = 'result';
UPDATE hard_words SET meaning_vi = 'duy nhất, đơn; độc thân, chưa kết hôn' WHERE word = 'single';
UPDATE hard_words SET part_of_speech = 'Adverb / Adjective', meaning_vi = 'vẫn; yên, không chuyển động' WHERE word = 'still';
UPDATE hard_words SET meaning_vi = 'căng thẳng; trọng âm, sự nhấn mạnh' WHERE word = 'stress';
UPDATE hard_words SET meaning_vi = 'ủng hộ, hỗ trợ; đỡ, nâng đỡ' WHERE word = 'support';
UPDATE hard_words SET meaning_vi = 'giá trị; nguyên tắc, điều coi trọng' WHERE word = 'value';

INSERT OR IGNORE INTO hard_word_examples (word, position, english, vietnamese) VALUES
  ('about', 6, 'The flight takes about two hours.', 'Chuyến bay mất khoảng hai giờ.'),
  ('admit', 6, 'Only ticket holders are admitted into the theater.', 'Chỉ người có vé mới được vào nhà hát.'),
  ('benefit', 6, 'The government offers a housing benefit to low-income families.', 'Chính phủ trợ cấp nhà ở cho các gia đình có thu nhập thấp.'),
  ('chance', 6, 'There is a good chance of rain tonight.', 'Tối nay có khả năng mưa cao.'),
  ('change', 6, 'Could you change this twenty-dollar bill for smaller bills?', 'Bạn có thể đổi tờ hai mươi đô này thành các tờ tiền nhỏ hơn không?'),
  ('common', 6, 'We share a common goal.', 'Chúng tôi có chung một mục tiêu.'),
  ('consider', 6, 'I consider her a close friend.', 'Tôi xem cô ấy là một người bạn thân.'),
  ('deal with', 6, 'This book deals with the history of the city.', 'Cuốn sách này bàn về lịch sử của thành phố.'),
  ('degree', 6, 'The temperature fell by five degrees overnight.', 'Nhiệt độ giảm năm độ trong đêm.'),
  ('fail', 6, 'She failed her driving test on Monday.', 'Cô ấy trượt bài thi lái xe vào thứ Hai.'),
  ('feel', 6, 'Feel this fabric; it is very soft.', 'Hãy sờ tấm vải này; nó rất mềm.'),
  ('get', 6, 'He got a letter from his sister yesterday.', 'Hôm qua anh ấy nhận được thư từ chị gái.'),
  ('get', 7, 'I get the idea now.', 'Bây giờ tôi hiểu ý rồi.'),
  ('give up', 6, 'The soldiers gave up after they ran out of supplies.', 'Những người lính đầu hàng sau khi cạn nguồn tiếp tế.'),
  ('handle', 6, 'Please handle the glass vase with care.', 'Xin hãy cầm chiếc bình thủy tinh thật cẩn thận.'),
  ('issue', 6, 'The latest issue of the magazine is on my desk.', 'Số mới nhất của tạp chí nằm trên bàn làm việc của tôi.'),
  ('last', 6, 'The battery should last all day.', 'Pin sẽ dùng được cả ngày.'),
  ('mean', 6, 'What did you mean by that comment?', 'Ý bạn muốn nói gì qua lời nhận xét đó?'),
  ('mind', 6, 'Do you mind if I open the window?', 'Bạn có phiền nếu tôi mở cửa sổ không?'),
  ('present', 6, 'He gave me a book as a birthday present.', 'Anh ấy tặng tôi một cuốn sách làm quà sinh nhật.'),
  ('pressure', 6, 'The pressure inside the tire is too low.', 'Áp suất bên trong lốp xe quá thấp.'),
  ('promotion', 6, 'The store is offering a promotion on winter coats.', 'Cửa hàng đang có chương trình khuyến mãi áo khoác mùa đông.'),
  ('promotion', 7, 'The promotion of the new app begins next week.', 'Việc quảng bá ứng dụng mới bắt đầu vào tuần tới.'),
  ('quality', 6, 'Patience is one of her best qualities.', 'Kiên nhẫn là một trong những phẩm chất tốt nhất của cô ấy.'),
  ('realize', 6, 'They realized their dream of owning a home.', 'Họ đã biến ước mơ có nhà thành hiện thực.'),
  ('reason', 6, 'We should use reason, not fear, to make this decision.', 'Chúng ta nên dùng lý trí, không phải nỗi sợ, để đưa ra quyết định này.'),
  ('result', 6, 'The new policy resulted in fewer delays.', 'Chính sách mới dẫn đến ít sự chậm trễ hơn.'),
  ('single', 6, 'She is single and enjoys living on her own.', 'Cô ấy chưa kết hôn và thích sống một mình.'),
  ('still', 6, 'Please hold still while I take your picture.', 'Vui lòng đứng yên để tôi chụp ảnh.'),
  ('stress', 6, 'The stress falls on the second syllable.', 'Trọng âm rơi vào âm tiết thứ hai.'),
  ('support', 6, 'These columns support the roof.', 'Những cây cột này đỡ mái nhà.'),
  ('value', 6, 'Honesty is one of the values she cares most about.', 'Sự trung thực là một trong những giá trị cô ấy coi trọng nhất.');
