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
    font-size: 135%;
    display: flex;
    margin-top: 2px;
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
</style>`;

module.exports = headerString;