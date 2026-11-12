UPDATE hard_words
SET meaning_vi = CASE word
  WHEN 'access' THEN 'quyền truy cập, lối vào'
  WHEN 'across' THEN 'băng qua, ở phía bên kia'
  WHEN 'among' THEN 'trong số, giữa'
  WHEN 'another' THEN 'một cái/người khác, thêm một'
  WHEN 'any' THEN 'bất kỳ, chút nào'
  WHEN 'between' THEN 'ở giữa, giữa'
  WHEN 'cause' THEN 'nguyên nhân'
  WHEN 'certainly' THEN 'chắc chắn, nhất định'
  WHEN 'during' THEN 'trong suốt, trong khi'
  WHEN 'effect' THEN 'tác động, hiệu quả'
  WHEN 'even if' THEN 'ngay cả khi, dù cho'
  WHEN 'except' THEN 'ngoại trừ'
  WHEN 'expectation' THEN 'sự mong đợi, kỳ vọng'
  WHEN 'in case' THEN 'phòng khi, trong trường hợp'
  WHEN 'issue' THEN 'vấn đề, sự cố'
  WHEN 'no' THEN 'không, không có'
  WHEN 'notice' THEN 'thông báo, sự chú ý'
  WHEN 'occur' THEN 'xảy ra, xuất hiện'
  WHEN 'often' THEN 'thường, hay'
  WHEN 'other' THEN 'khác, những ... khác'
  WHEN 'others' THEN 'những người/vật khác'
  WHEN 'preference' THEN 'sở thích, sự ưu tiên'
  WHEN 'rarely' THEN 'hiếm khi'
  WHEN 'some' THEN 'một vài, một ít'
  WHEN 'sometimes' THEN 'đôi khi, thỉnh thoảng'
  WHEN 'through' THEN 'xuyên qua, thông qua'
  WHEN 'toward' THEN 'về phía, hướng tới'
  WHEN 'usually' THEN 'thường, thường xuyên'
  WHEN 'whether' THEN 'liệu rằng, có ... hay không'
  WHEN 'worth' THEN 'đáng, xứng đáng'
END
WHERE word IN (
  'access', 'across', 'among', 'another', 'any', 'between', 'cause',
  'certainly', 'during', 'effect', 'even if', 'except', 'expectation',
  'in case', 'issue', 'no', 'notice', 'occur', 'often', 'other', 'others',
  'preference', 'rarely', 'some', 'sometimes', 'through', 'toward', 'usually',
  'whether', 'worth'
);
