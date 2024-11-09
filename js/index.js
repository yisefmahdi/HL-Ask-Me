      $(document).ready(function () {
        $("#word_limit").val(100);
        const chatInput = $("#chat-input");
        const sendButton = $("#send-btn");
        const chatContainer = $(".chat-container");
        const deleteButton = $("#delete-btn");
        let userText = null;
        const userId = 12; // قم بتغيير هذا إلى المعرف المناسب (من تسجيل الدخول أو مصدر آخر)
        const chatKey = `all-chats-12`; // المفتاح الديناميكي الذي يعتمد على معرف المستخدم

        // تحميل البيانات من التخزين المحلي
        const loadDataFromLocalstorage = () => {
          const defaultText = `<div class="default-text">
                        <h1>HL Ask Me v1</h1>
                        <p>هيَّا اطرح سؤالاً من كتابك لنقوم بالبحث عنه بسرعة ودقة عالية مع HL Ask.</p>
                    </div>`;

          chatContainer.html(localStorage.getItem(chatKey) || defaultText);
          chatContainer.scrollTop(chatContainer.prop("scrollHeight"));
          initializeButtons(); // إعادة تهيئة الأزرار بعد تحميل الدردشة
        };

        // دالة تهيئة الأزرار
        const initializeButtons = () => {
          $(".show-book-button")
            .off("click")
            .on("click", function () {
              $(this).closest(".chat").next(".book-container").toggle();
            });
        };

        // إنشاء عنصر محادثة
        const createChatElement = (content, className) => {
          const chatDiv = $("<div></div>")
            .addClass("chat")
            .addClass(className)
            .html(content);
          return chatDiv;
        };

        const highlightText = (text, keywords) => {
          if (!keywords) return text; // إذا لم توجد كلمات، أعد النص كما هو
          const regex = new RegExp(`(${keywords.join("|")})`, "gi"); // بناء تعبير نمطي للكلمات
          return text.replace(
            regex,
            `<span style="background-color: yellow; color: var(--text-color);">$1</span>`
          ); // تمييز الكلمات
        };

        const getChatResponse = async (incomingChatDiv) => {
          const pElement = $("<p></p>"); // استخدام pElement فقط
          var word_limit = $("#word_limit").val();
          var question = userText;
          try {
            // إرسال الطلب إلى خادمك الخاص
            const response = await axios.post("http://127.0.0.1:5555/ask", {
              question: question,
              word_limit: word_limit,
            });

            console.log(response);

            // التحقق مما إذا كان الرد يحتوي على الحقل المطلوب
            if (response.data.response) {
              const bookPiece = response.data.response.book_piece.trim();
              const keywords = userText
                .split(" ")
                .map((word) => word.toLowerCase()); // تقسيم السؤال إلى كلمات

              // تحقق من وجود أي كلمة مفتاحية في النص
              function escapeRegExp(string) {
                return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              }

              const containsKeywords = keywords.some((keyword) =>
                bookPiece.toLowerCase().includes(keyword.toLowerCase())
              );

              if (containsKeywords) {
                // تمييز الكلمات المفتاحية في النص
                const highlightedBookPiece = highlightText(
                  bookPiece,
                  keywords.map((keyword) => escapeRegExp(keyword)) // تهريب الأحرف الخاصة
                );

                // وضع النص المميز في pElement
                pElement
                  .html(highlightedBookPiece)
                  .addClass("highlighted-text");
              } else {
                // عرض النص الأصلي بدون تمييز إذا لم يكن هناك كلمات مفتاحية
                pElement.text(bookPiece).addClass("highlighted-text");
              }
            } else {
              pElement.addClass("error").text("حدث خطأ انثاء العملية  ");
            }
          } catch (error) {
            pElement.addClass("error").text("حدث خطأ انثاء العملية  ");
          }

          // إزالة حركة الكتابة
          incomingChatDiv.find(".typing-animation").remove();

          // إضافة الردود إلى الدردشة
          incomingChatDiv.find(".chat-details").append(pElement);

          // إضافة النص المميز مع الخلفية الصفراء
          localStorage.setItem(chatKey, chatContainer.html());
          chatContainer.scrollTop(chatContainer.prop("scrollHeight"));
        };

        // عرض حركة الكتابة
        const showTypingAnimation = () => {
          const html = `<div class="chat-content">
                        <div class="chat-details">
                            <div class="typing-animation">
                                <div class="typing-dot" style="--delay: 0.2s"></div>
                                <div class="typing-dot" style="--delay: 0.3s"></div>
                                <div class="typing-dot" style="--delay: 0.4s"></div>
                            </div>
                        </div>
                    </div>`;

          const incomingChatDiv = createChatElement(html, "incoming");
          chatContainer.append(incomingChatDiv);
          chatContainer.scrollTop(chatContainer.prop("scrollHeight"));
          getChatResponse(incomingChatDiv);
        };

        // معالجة الدردشة الصادرة
        const handleOutgoingChat = () => {
          userText = chatInput.val().trim();
          if (!userText) return;
          chatInput.val("");
          chatInput.height(initialInputHeight);

          const html = `<div class="chat-content">
                        <div class="chat-details">
                            <p>${userText}</p>
                        </div>
                    </div>`;

          const outgoingChatDiv = createChatElement(html, "outgoing");
          chatContainer.find(".default-text").remove();
          chatContainer.append(outgoingChatDiv);
          chatContainer.scrollTop(chatContainer.prop("scrollHeight"));
          setTimeout(showTypingAnimation, 100);
        };

        // الأزرار وإجراءات المستخدم
        deleteButton.on("click", () => {
          if (confirm("هل انت متاكد من حذف الشات?")) {
            localStorage.removeItem(chatKey);
            loadDataFromLocalstorage();
          }
        });

        // إعداد ارتفاع حقل الإدخال
        const initialInputHeight = chatInput[0].scrollHeight;

        chatInput.on("input", () => {
          chatInput.height(initialInputHeight);
          chatInput.height(chatInput[0].scrollHeight);
        });

        chatInput.on("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey && $(window).width() > 800) {
            e.preventDefault();
            handleOutgoingChat();
          }
        });

        // إطلاق الوظائف عند تحميل الصفحة
        loadDataFromLocalstorage();
        sendButton.on("click", handleOutgoingChat);
      });
    