use serde::{Deserialize, Serialize};

/// Represents a basic token with position information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Token {
    pub start: usize,
    pub end: usize,
}

/// Represents an identifier token
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdentifierToken {
    #[serde(flatten)]
    pub token: Token,
    pub name: String,
}

/// Represents a literal token (string, number, etc.)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiteralToken {
    #[serde(flatten)]
    pub token: Token,
    pub value: String,
    pub raw: String,
    pub escape: bool,
}

/// Represents an expression token ({{ ... }})
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpressionToken {
    #[serde(flatten)]
    pub token: Token,
    pub expression: String,
}

/// Represents a markup token for HTML/XML elements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarkupToken {
    #[serde(flatten)]
    pub token: Token,
    pub tag_name: String,
    pub attributes: Option<ObjectToken>,
    pub children: Vec<MarkupChildToken>,
}

/// Represents an object token (for attributes, etc.)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObjectToken {
    #[serde(flatten)]
    pub token: Token,
    pub properties: Vec<PropertyToken>,
}

/// Represents a property in an object
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyToken {
    #[serde(flatten)]
    pub token: Token,
    pub key: String,
    pub value: Option<String>,
}

/// Child elements in markup (can be literal text or nested markup)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum MarkupChildToken {
    Literal(LiteralToken),
    Markup(Box<MarkupToken>),
    Expression(ExpressionToken),
}
