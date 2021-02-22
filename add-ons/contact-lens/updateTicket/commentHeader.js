const headerString = () => `<style>
.contact-lens-box {
    background-color: #fafafa; 
    color: #575757; 
    padding: 10px 36px 0 36px; 
    border: 1px solid #ccc;
    margin-bottom: 5px;
}
.contact-lens-box P {
    padding-bottom: 2px;
}
.contact-lens-section-title {
    font-size: 140%; 
    margin: 20px 0 12px 0; 
}
.lens-cat {
    display: inline-block;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 3px;
    padding: 2px 7px;
    margin: 0 10px 6px 0;
}
.agent-time {
    display: flex;
    justify-content: flex-start;
    font-size: 80%;
    margin-left: 2px;
}
.customer-time {
    display: flex;
    justify-content: flex-end;
    font-size: 80%;
    margin-right: 2px;
}
.turn-bubble {
    border-radius: 5px; 
    margin: 0 4px 15px 4px;
    max-width: 90%; 
    padding: 5px 10px;
}
.agent-turn {
    display: flex;
    justify-content: flex-start;
}
.agent-turn DIV {
    background-color: white;
}
.customer-turn {
    color: #1890ff;
    display: flex;
    justify-content: flex-end;
}
.customer-turn DIV {
    background-color: #e6f7ff;
}
.sentiment-icon {
    width: 24px;
    height: 24px;
    display: flex;
}
.sentiment-icon-agent {
    justify-content: flex-start;
    float: left;
    margin-left: -28px;
}
.sentiment-icon-customer {
    justify-content: flex-end;
    float: right;
    margin-right: -28px;
}
</style><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" display="none">
<symbol id="iconSentimentPositive" viewBox="0 0 24 24" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g id="Transcript" transform="translate(-4.000000, -71.000000)" fill-rule="nonzero">
        <g id="Group" transform="translate(4.000000, 51.000000)">
            <g id="baseline-sentiment-very-satisfied" transform="translate(0.000000, 20.000000)">
                <circle id="Oval" fill="#52C41A" cx="15.5" cy="9.5" r="1.5"></circle>
                <circle id="Oval" fill="#52C41A" cx="8.5" cy="9.5" r="1.5"></circle>
                <path d="M11.99,2 C6.47,2 2,6.48 2,12 C2,17.52 6.47,22 11.99,22 C17.52,22 22,17.52 22,12 C22,6.48 17.52,2 11.99,2 Z M12,20 C7.58,20 4,16.42 4,12 C4,7.58 7.58,4 12,4 C16.42,4 20,7.58 20,12 C20,16.42 16.42,20 12,20 Z M7,14 C7.78,16.34 9.72,18 12,18 C14.28,18 16.22,16.34 17,14 L7,14 Z" id="Shape" fill="#52C41A"></path>
                <rect id="Rectangle" fill-opacity="0" fill="#000000" x="0" y="0" width="24" height="24"></rect>
            </g>
        </g>
    </g>
</symbol>
</svg><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" display="none">
<symbol id="iconSentimentNeutral" viewBox="0 0 24 24" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g id="Transcript" transform="translate(-4.000000, -255.000000)" fill="#000000" fill-rule="nonzero">
        <g id="Group-3" transform="translate(4.000000, 235.000000)">
            <g id="outline-sentiment-neutral" transform="translate(0.000000, 20.000000)">
                <polygon id="Path" fill-opacity="0.55" points="9 14 15 14 15 15.5 9 15.5"></polygon>
                <circle id="Oval" fill-opacity="0.55" cx="15.5" cy="9.5" r="1.5"></circle>
                <circle id="Oval" fill-opacity="0.55" cx="8.5" cy="9.5" r="1.5"></circle>
                <path d="M11.99,2 C6.47,2 2,6.48 2,12 C2,17.52 6.47,22 11.99,22 C17.52,22 22,17.52 22,12 C22,6.48 17.52,2 11.99,2 Z M12,20 C7.58,20 4,16.42 4,12 C4,7.58 7.58,4 12,4 C16.42,4 20,7.58 20,12 C20,16.42 16.42,20 12,20 Z" id="Shape" fill-opacity="0.55"></path>
                <rect id="Rectangle" fill-opacity="0" x="0" y="0" width="24" height="24"></rect>
            </g>
        </g>
    </g>
</symbol>
</svg><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" display="none">
<symbol id="iconSentimentMixed" viewBox="0 0 24 24" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g id="Transcript" transform="translate(-772.000000, -347.000000)" fill-rule="nonzero">
        <g id="Group-4" transform="translate(48.000000, 327.000000)">
            <g id="round-sentiment-slightly-dissatisfied" transform="translate(724.000000, 20.000000)">
                <circle id="Oval" fill="#FAAD14" cx="15.5" cy="9.5" r="1.5"></circle>
                <circle id="Oval" fill="#FAAD14" cx="8.5" cy="9.5" r="1.5"></circle>
                <path d="M11.99,2 C6.47,2 2,6.48 2,12 C2,17.52 6.47,22 11.99,22 C17.52,22 22,17.52 22,12 C22,6.48 17.52,2 11.99,2 Z M12,20 C7.58,20 4,16.42 4,12 C4,7.58 7.58,4 12,4 C16.42,4 20,7.58 20,12 C20,16.42 16.42,20 12,20 Z M12,16.5 C12.537,16.5 13.036,16.603 13.494,16.793 C13.889,16.933 14.199,16.792 14.381,16.561 C14.626,16.251 14.597,15.622 14.094,15.418 C12.7597423,14.8653874 11.2614161,14.8610757 9.924,15.406 C9.424,15.61 9.339,16.244 9.643,16.594 C9.84,16.821 10.167,16.909 10.503,16.788 C10.964,16.603 11.463,16.5 12,16.5 L12,16.5 Z" id="Shape" fill="#FAAD14"></path>
                <rect id="Rectangle" fill-opacity="0" fill="#000000" x="0" y="0" width="24" height="24"></rect>
            </g>
        </g>
    </g>
</symbol>
</svg><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" display="none">
<symbol id="iconSentimentNegative" viewBox="0 0 24 24" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
    <g id="Transcript" transform="translate(-772.000000, -163.000000)" fill-rule="nonzero">
        <g id="Group-2" transform="translate(48.000000, 143.000000)">
            <g id="baseline-sentiment-very-dissatisfied" transform="translate(724.000000, 20.000000)">
                <circle id="Oval" fill="#FF4D4F" cx="15.5" cy="9.5" r="1.5"></circle>
                <circle id="Oval" fill="#FF4D4F" cx="8.5" cy="9.5" r="1.5"></circle>
                <path d="M11.99,2 C6.47,2 2,6.48 2,12 C2,17.52 6.47,22 11.99,22 C17.52,22 22,17.52 22,12 C22,6.48 17.52,2 11.99,2 Z M12,20 C7.58,20 4,16.42 4,12 C4,7.58 7.58,4 12,4 C16.42,4 20,7.58 20,12 C20,16.42 16.42,20 12,20 Z M12,14 C9.67,14 7.68,15.45 6.88,17.5 L8.55,17.5 C9.24,16.31 10.52,15.5 12,15.5 C13.48,15.5 14.75,16.31 15.45,17.5 L17.12,17.5 C16.32,15.45 14.33,14 12,14 L12,14 Z" id="Shape" fill="#FF4D4F"></path>
                <rect id="Rectangle" fill-opacity="0" fill="#000000" x="0" y="0" width="24" height="24"></rect>
            </g>
        </g>
    </g>
</symbol>
</svg>`;

module.exports = headerString;