import type { KeyPhrase } from '../../domain/entities/KeyPhrase';

/**
 * A curated, static dictionary of words and phrases commonly tested in
 * IELTS Listening (especially Sections 3-4: academic discussions and
 * lectures). Used as a free, offline substitute for AI-driven key-phrase
 * extraction: paragraphs are scanned for these exact phrases instead of
 * asking a language model to identify them contextually.
 *
 * This trades adaptiveness (a model can spot phrases specific to any
 * passage) for zero cost: the list only ever flags phrases that are
 * already known to be valuable for IELTS 7.0 preparation.
 */
export const IELTS_KEY_PHRASES: KeyPhrase[] = [
  // --- Signposting / linking language -----------------------------
  { phrase: 'on the other hand', meaningJa: '一方で', noteJa: '対比を導く。IELTSでは意見や視点の切り替えによく使われる。' },
  { phrase: 'as a result', meaningJa: 'その結果', noteJa: '因果関係を示す。前の内容の結果を述べるときの定番表現。' },
  { phrase: 'in addition', meaningJa: '加えて', noteJa: '情報を追加するときの標準的なつなぎ言葉。' },
  { phrase: 'in contrast', meaningJa: 'それとは対照的に', noteJa: '2つの事柄の違いを強調する際に使う。' },
  { phrase: 'furthermore', meaningJa: 'さらに', noteJa: 'ややフォーマル。講義形式のリスニングで頻出。' },
  { phrase: 'therefore', meaningJa: 'したがって', noteJa: '結論・帰結を導く。論理展開を追う上で重要な語。' },
  { phrase: 'meanwhile', meaningJa: 'その一方で／その間に', noteJa: '同時進行の出来事や対比を示す。' },
  { phrase: 'subsequently', meaningJa: 'その後', noteJa: '時系列で次に起きたことを述べる。会話パートでも使われる。' },
  { phrase: 'nevertheless', meaningJa: 'それにもかかわらず', noteJa: '逆接。前の内容と矛盾するように見える情報が続く合図。' },
  { phrase: 'moreover', meaningJa: 'その上', noteJa: '情報の追加。furthermoreとほぼ同義。' },
  { phrase: 'in terms of', meaningJa: '〜の点では', noteJa: '話題を限定する表現。「〜に関して言えば」の意味。' },
  { phrase: 'with regard to', meaningJa: '〜に関して', noteJa: 'フォーマルな話題転換表現。講義でよく使われる。' },
  { phrase: 'as opposed to', meaningJa: '〜とは対照的に', noteJa: '2つの選択肢や考え方を比較する際の表現。' },
  { phrase: 'provided that', meaningJa: '〜という条件で', noteJa: '条件を示す。ifよりややフォーマル。' },
  { phrase: 'in the meantime', meaningJa: 'その間に', noteJa: '2つの出来事の間の時間を指す。一時的な措置を述べる際にも使われる。' },
  { phrase: 'on top of that', meaningJa: 'それに加えて', noteJa: 'ややカジュアル。会話パートで追加情報を示す。' },
  { phrase: 'to sum up', meaningJa: '要約すると', noteJa: '講義の最後、まとめに入る合図。設問の答えが集約されやすい。' },
  { phrase: 'in conclusion', meaningJa: '結論として', noteJa: '講義・発表の締めくくりを示す定番表現。' },
  { phrase: 'first and foremost', meaningJa: '何よりもまず', noteJa: '最重要点を導入する際の強調表現。' },
  { phrase: 'last but not least', meaningJa: '最後に大事な点として', noteJa: 'リストの最後の項目でも重要度が低くないことを示す。' },
  { phrase: 'that being said', meaningJa: 'とはいえ', noteJa: '直前の内容を認めつつ逆の点を述べる際の口語的つなぎ。' },
  { phrase: 'having said that', meaningJa: 'そうは言っても', noteJa: 'that being saidとほぼ同義。会話でよく使われる。' },
  { phrase: 'in other words', meaningJa: '言い換えると', noteJa: '直前の内容を別の言葉で言い直す合図。パラフレーズの典型。' },
  { phrase: 'that is to say', meaningJa: 'つまり', noteJa: '説明・言い換えを導入する表現。' },
  { phrase: 'to put it another way', meaningJa: '別の言い方をすれば', noteJa: '言い換え表現。in other wordsと同様に使われる。' },

  // --- Phrasal verbs common in lectures / conversations -----------
  { phrase: 'point out', meaningJa: '指摘する', noteJa: '講師や話者が重要な点を強調する際によく使う動詞句。' },
  { phrase: 'carry out', meaningJa: '実行する', noteJa: '研究や実験、調査の実施について話す際に頻出。' },
  { phrase: 'take into account', meaningJa: '考慮に入れる', noteJa: '条件や要因を検討する文脈で使われる。' },
  { phrase: 'come up with', meaningJa: '思いつく／考案する', noteJa: 'アイデアや解決策を生み出す場面で使われる。' },
  { phrase: 'look into', meaningJa: '調査する', noteJa: '問題や疑問を詳しく調べるという意味。' },
  { phrase: 'set up', meaningJa: '設置する／設定する', noteJa: '実験・組織・機材の準備を表す。会話パートでも頻出。' },
  { phrase: 'figure out', meaningJa: '理解する／解決する', noteJa: 'カジュアルな表現。問題の解決や理解を示す。' },
  { phrase: 'deal with', meaningJa: '対処する', noteJa: '問題や課題への対応を述べるときの基本表現。' },
  { phrase: 'cut down on', meaningJa: '減らす', noteJa: '使用量や頻度を減らすことを表す。日常会話パートで頻出。' },
  { phrase: 'make up for', meaningJa: '埋め合わせをする', noteJa: '不足や損失を補う場面で使われる。' },
  { phrase: 'put off', meaningJa: '延期する', noteJa: '予定や締め切りを先送りする意味。' },
  { phrase: 'bring about', meaningJa: '引き起こす', noteJa: '変化や結果を生じさせるという意味。causeのフォーマルな言い換え。' },
  { phrase: 'go through', meaningJa: '経験する／見直す', noteJa: '文脈により「経験する」「詳しく確認する」の両方の意味を持つ。' },
  { phrase: 'hand in', meaningJa: '提出する', noteJa: 'レポートや課題の提出について話す学生生活の文脈で頻出。' },
  { phrase: 'sign up for', meaningJa: '申し込む', noteJa: '講座やイベントへの登録を表す。会話パートの定番表現。' },
  { phrase: 'drop out', meaningJa: '中退する／脱落する', noteJa: '講座や活動を途中でやめることを表す。' },
  { phrase: 'catch up on', meaningJa: '遅れを取り戻す', noteJa: '授業や課題の遅れを取り戻す場面で使われる。' },
  { phrase: 'rule out', meaningJa: '除外する', noteJa: '可能性や選択肢を除外するという意味。議論パートで頻出。' },
  { phrase: 'account for', meaningJa: '説明する／〜の割合を占める', noteJa: '理由の説明と割合の両方の意味があるため文脈に注意。' },
  { phrase: 'break down', meaningJa: '分解する／内訳を示す', noteJa: 'データや費用の内訳を説明する際によく使われる。' },
  { phrase: 'stem from', meaningJa: '〜に由来する', noteJa: '原因や起源を説明するフォーマルな表現。' },
  { phrase: 'give rise to', meaningJa: '〜を引き起こす', noteJa: 'bring aboutと同様、原因結果を示すフォーマルな表現。' },
  { phrase: 'boil down to', meaningJa: '要するに〜になる', noteJa: '複雑な内容を単純化してまとめる際の口語表現。' },
  { phrase: 'branch out into', meaningJa: '〜へ活動範囲を広げる', noteJa: '新しい分野や事業に手を広げることを表す。' },
  { phrase: 'zero in on', meaningJa: '〜に焦点を絞る', noteJa: '議論や調査の焦点を特定する場面で使われる。' },

  // --- Academic / formal vocabulary --------------------------------
  { phrase: 'significant', meaningJa: '重要な／有意な', noteJa: '統計的な意味でも日常的な意味でも使われる頻出語。' },
  { phrase: 'substantial', meaningJa: 'かなりの／相当な', noteJa: '量や規模の大きさを表すフォーマルな形容詞。' },
  { phrase: 'considerable', meaningJa: 'かなりの', noteJa: 'substantialとほぼ同義。数値や変化の大きさを表す。' },
  { phrase: 'predominantly', meaningJa: '主に', noteJa: 'mainlyのフォーマルな言い換え。講義でよく使われる。' },
  { phrase: 'consequently', meaningJa: '結果として', noteJa: 'thereforeと同様、因果関係を示す接続副詞。' },
  { phrase: 'inevitably', meaningJa: '必然的に', noteJa: '避けられない結果であることを強調する表現。' },
  { phrase: 'comprehensive', meaningJa: '包括的な', noteJa: '調査や計画が網羅的であることを表す。' },
  { phrase: 'preliminary', meaningJa: '予備的な', noteJa: '研究の初期段階を表す語。研究紹介の文脈で頻出。' },
  { phrase: 'criteria', meaningJa: '基準（複数形）', noteJa: '単数形はcriterion。評価基準を述べる際に使われる。' },
  { phrase: 'methodology', meaningJa: '方法論', noteJa: '研究の進め方を説明する際に使われるアカデミック語彙。' },
  { phrase: 'hypothesis', meaningJa: '仮説', noteJa: '研究・実験の文脈で頻出。動詞形はhypothesize。' },
  { phrase: 'framework', meaningJa: '枠組み', noteJa: '理論や制度の全体構造を指す語。講義で頻出。' },
  { phrase: 'correlate with', meaningJa: '〜と相関する', noteJa: '統計的な関係性を述べる際の学術表現。' },
  { phrase: 'component', meaningJa: '構成要素', noteJa: 'システムや制度の一部分を指すフォーマルな語。' },
  { phrase: 'phenomenon', meaningJa: '現象', noteJa: '複数形phenomena。科学・社会科学の講義で頻出。' },
  { phrase: 'implications', meaningJa: '影響／意味合い', noteJa: '結果がもたらす影響について述べる際に使われる。' },
  { phrase: 'feasible', meaningJa: '実現可能な', noteJa: '計画や案が実行可能かどうかを議論する際に使われる。' },
  { phrase: 'coherent', meaningJa: '首尾一貫した', noteJa: '論理や構成のまとまりの良さを表す形容詞。' },
  { phrase: 'ambiguous', meaningJa: '曖昧な', noteJa: '意味や指示が不明瞭であることを表す。' },
  { phrase: 'underlying', meaningJa: '根底にある', noteJa: '表面には見えない原因や理由を指す形容詞。' },
  { phrase: 'empirical', meaningJa: '経験的な／実証的な', noteJa: '理論ではなく観察・実験に基づくことを表す。' },
  { phrase: 'controversial', meaningJa: '物議を醸す', noteJa: '意見が分かれる話題について述べる際に使われる。' },
  { phrase: 'prevalent', meaningJa: '広く行き渡っている', noteJa: '現象や傾向が一般的であることを表す。' },
  { phrase: 'sustainable', meaningJa: '持続可能な', noteJa: '環境・資源関連の講義で非常によく使われる語。' },
  { phrase: 'a wide range of', meaningJa: '幅広い〜', noteJa: '選択肢や種類の多さを表す表現。' },
  { phrase: 'in conjunction with', meaningJa: '〜と連携して', noteJa: '複数の要素・組織が協力して機能することを表す。' },
  { phrase: 'irrespective of', meaningJa: '〜にかかわらず', noteJa: 'regardless ofのフォーマルな言い換え。' },
  { phrase: 'in the context of', meaningJa: '〜という文脈では', noteJa: '議論の前提条件を示す表現。' },
  { phrase: 'on the whole', meaningJa: '全体として', noteJa: '個別の詳細ではなく全体的な傾向を述べる際の表現。' },
  { phrase: 'to a certain extent', meaningJa: 'ある程度は', noteJa: '完全な同意でも否定でもないことを示す表現。' },

  // --- Quantity / approximation expressions ------------------------
  { phrase: 'a handful of', meaningJa: 'ほんの一握りの', noteJa: '数が少ないことを表す口語的表現。' },
  { phrase: 'the majority of', meaningJa: '大部分の', noteJa: '半数を超える割合を示す表現。統計の説明で頻出。' },
  { phrase: 'a fraction of', meaningJa: 'ごく一部の', noteJa: '全体に対してごく小さい割合であることを表す。' },
  { phrase: 'roughly', meaningJa: 'おおよそ', noteJa: 'approximatelyのカジュアルな言い換え。数値の前によく置かれる。' },
  { phrase: 'approximately', meaningJa: 'およそ', noteJa: '正確な数値ではないことを示すフォーマルな副詞。' },
  { phrase: 'the vast majority', meaningJa: '大多数', noteJa: 'the majorityよりさらに強い「ほとんど全て」に近い割合。' },
  { phrase: 'a considerable amount of', meaningJa: 'かなりの量の', noteJa: '量の多さを強調するフォーマルな表現。' },
  { phrase: 'a mere', meaningJa: 'わずか〜にすぎない', noteJa: '数値や量が予想より少ないことを強調する。' },
  { phrase: 'at least', meaningJa: '少なくとも', noteJa: '下限を示す。数値問題の聞き取りで重要。' },
  { phrase: 'at most', meaningJa: '多くとも／せいぜい', noteJa: '上限を示す。at leastと対になる表現。' },
];
