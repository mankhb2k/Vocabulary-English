ALTER TABLE vocabulary_entries
  ADD COLUMN usage_note TEXT NOT NULL DEFAULT '';

UPDATE vocabulary_entries
SET example = 'Can you help me with this task?' || char(10) ||
  'She helped her colleague prepare for the meeting.' || char(10) ||
  'This guide will help you understand the process.',
  usage_note = 'The base word in this family.'
WHERE id = 'demo-help';

UPDATE vocabulary_entries
SET example = 'The instructions were very helpful.' || char(10) ||
  'A helpful colleague explained the new process.' || char(10) ||
  'This checklist is helpful when you are preparing.',
  usage_note = 'The suffix -ful often means full of or providing.'
WHERE id = 'demo-helpful';

UPDATE vocabulary_entries
SET example = 'He felt helpless during the emergency.' || char(10) ||
  'Without the right tools, the team was helpless.' || char(10) ||
  'She looked helpless when the computer stopped working.',
  usage_note = 'The suffix -less often means without.'
WHERE id = 'demo-helpless';

UPDATE vocabulary_entries
SET example = 'She works as a classroom helper.' || char(10) ||
  'A volunteer helper showed us where to go.' || char(10) ||
  'The software includes a helpful setup assistant.',
  usage_note = 'The suffix -er can describe a person who does an action.'
WHERE id = 'demo-helper';

UPDATE vocabulary_entries
SET example = 'He helpfully explained the next steps.' || char(10) ||
  'She helpfully shared her notes with the group.' || char(10) ||
  'The assistant helpfully pointed out a missing detail.',
  usage_note = 'The suffix -ly forms an adverb.'
WHERE id = 'demo-helpfully';

UPDATE vocabulary_entries
SET example = 'The reply was vague and unhelpful.' || char(10) ||
  'An unhelpful comment can make a problem harder.' || char(10) ||
  'The old instructions were confusing and unhelpful.',
  usage_note = 'The prefix un- often gives a word the opposite meaning.'
WHERE id = 'demo-unhelpful';

INSERT OR IGNORE INTO vocabulary_entries
  (id, word, definition, pronunciation, example, topic, image_key, source, usage_note)
VALUES
  ('demo-resilient', 'resilient', 'Able to recover quickly from difficulties.', '/rɪˈzɪliənt/', 'She is resilient and never gives up.' || char(10) || 'The team stayed resilient after the first plan failed.' || char(10) || 'Regular practice can help learners become more resilient.', 'work', 'placeholder-1.png', 'system', 'Often used to describe a person, team, or system that adapts well to problems.'),
  ('demo-curious', 'curious', 'Wanting to know or learn something.', '/ˈkjʊəriəs/', 'He is curious about how the machine works.' || char(10) || 'Curious learners ask questions and explore new ideas.' || char(10) || 'She was curious to find out what happened next.', 'greetings', 'placeholder-1.png', 'system', 'A positive word for someone who enjoys discovering new ideas.'),
  ('demo-consistent', 'consistent', 'Doing something in the same reliable way over time.', '/kənˈsɪstənt/', 'Consistent practice leads to steady progress.' || char(10) || 'The team delivered consistent results throughout the project.' || char(10) || 'Try to be consistent with your daily study routine.', 'work', 'placeholder-1.png', 'system', 'Useful when talking about habits, effort, or quality.'),
  ('demo-adapt', 'adapt', 'To change your behaviour or methods to suit a new situation.', '/əˈdæpt/', 'Good learners adapt when a strategy does not work.' || char(10) || 'We had to adapt our plans because of the weather.' || char(10) || 'The company adapted quickly to changing customer needs.', 'work', 'placeholder-1.png', 'system', 'A common verb for change, learning, and problem-solving.'),
  ('demo-confident', 'confident', 'Feeling sure about your abilities or decisions.', '/ˈkɒnfɪdənt/', 'She feels more confident after practising every day.' || char(10) || 'He sounded confident during the presentation.' || char(10) || 'A clear plan can make you more confident.', 'greetings', 'placeholder-1.png', 'system', 'Commonly used for skills, communication, and performance.'),
  ('demo-patient', 'patient', 'Able to wait or deal with difficulties without becoming upset.', '/ˈpeɪʃənt/', 'Be patient with yourself while you learn.' || char(10) || 'The teacher was patient with every question.' || char(10) || 'You need to be patient when a new skill feels difficult.', 'greetings', 'placeholder-1.png', 'system', 'This adjective can describe a person, attitude, or approach.'),
  ('demo-improve', 'improve', 'To become better or make something better.', '/ɪmˈpruːv/', 'Reading regularly can improve your vocabulary.' || char(10) || 'The team is working to improve the customer experience.' || char(10) || 'Small changes can improve the quality of your work.', 'work', 'placeholder-1.png', 'system', 'A common verb for progress, skills, and performance.'),
  ('demo-unwind', 'unwind', 'To relax after a period of work or activity.', '/ʌnˈwaɪnd/', 'I like to unwind with a short walk after work.' || char(10) || 'She unwinds by listening to music in the evening.' || char(10) || 'A quiet routine can help you unwind before bed.', 'travel', 'placeholder-1.png', 'system', 'Often used when talking about relaxing in the evening or at the weekend.');
