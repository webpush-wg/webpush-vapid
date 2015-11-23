---
title: Voluntary Application Server Identification for Web Push
abbrev: Self Identification
docname: draft-ietf-webpush-vapid-latest
date: 2015
category: std
ipr: trust200902

stand_alone: yes
pi: [toc, sortrefs, symrefs]

author:
 -
    ins: M. Thomson
    name: Martin Thomson
    org: Mozilla
    email: martin.thomson@gmail.com


normative:
  I-D.ietf-webpush-protocol:
  RFC2119:
  RFC5246:
  RFC5280:
  RFC2818:
  RFC7230:

informative:
  RFC7231:
  RFC7515:
  RFC7540:
  RFC7541:
  RFC6350:
  RFC5988:
  RFC6265:
  I-D.cavage-http-signatures:
  I-D.ietf-tls-tls13:
  I-D.ietf-tokbind-https:


--- abstract

An application server can voluntarily identify itself to a push service using
the described technique.  This identification information can be used by the
push service to attribute requests that are made by the same application server
to a single entity.  An application server is further able include additional
information the operator of a push service can use to contact the operator of
the application server.


--- middle

# Introduction

The Web Push protocol [I-D.ietf-webpush-protocol] describes how an application
server is able to request that a push service deliver a push message to a user
agent.

As a consequence of the expected deployment architecture, there is no basis for
an application server to be known to a push service prior to requesting delivery
of a push message.  By the same measure, requesting the creation of a
subscription for push message receipts has no prior authentication.  Requiring
that the push service be able to authenticate application servers places an
unwanted constraint on the interactions between user agents and application
servers, who are the ultimate users of a push service.  That constraint would
also degrade the privacy-preserving properties the protocol provides.  For these
reasons, [I-D.ietf-webpush-protocol] does not define a mandatory system for
authentication of application servers.

An unfortunate consequence of this design is that a push service is exposed to a
greater risk of denial of service attack.  While requests from application
servers can be indirectly attributed to user agents, this is not always
efficient or even sufficient.  Providing more information about the application
server more directly to a push service allows the push service to better
distinguish between legitimate and bogus requests.

This document describes a system whereby an application server can volunteer
information about itself to a push service.  At a minimum, this provides a
stable identity for the application server, though this could also include
contact information, such as an email address.

A consistent identity can be used by a push service to establish behavioral
expectations for an application server.  Significant deviations from an
established norm can then be used to trigger exception handling procedures.

Voluntarily-provided contact information can be used to contact an application
server operator in the case of exceptional situations.

Experience with push service deployment has shown that software errors or
unusual circumstances can cause large increases in push message volume.
Contacting the operator of the application server has proven to be valuable.

Even in the absence of usable contact information, an application server that
has a well-established reputation might be given preference over an unidentified
application server when choosing whether to discard a push message.


## Notational Conventions

The words "MUST", "MUST NOT", "SHOULD", and "MAY" are used in this document.
It's not shouting, when they are capitalized, they have the special meaning
described in [RFC2119].

The terms "push message", "push service", "application server", and "user agent"
are used as defined in [I-D.ietf-webpush-protocol]


# Self-Identification

A push service that supports application server self-identification requests a
client certificate from application servers.  The client certificate is
requested during the TLS [RFC5246] handshake.

An application server that does not have a client certificate offers no
certificate in response; an application server that wishes to self-identify
includes a certificate.

The certificate that the application server offers SHOULD be self-signed (see
Section 3.2 of [RFC5280]).  The certificate MAY contain an alternative name
extension (Section 4.2.1.6 of [RFC5280]) that includes contact information.  Of
the available options, an email address using the `rfc822Name` form or an HTTP
[RFC7230] (or HTTPS [RFC2818]) `uniformResourceIdentifier` SHOULD be included,
though including other options are not prohibited.

The offered end-entity certificate or the public key it contains becomes an
identifier for the application server.  Push services are able to reduce the
data they retain for an application server, either by extracting important
information like the subject public key information (SPKI), by hashing, or a
combination.  Of course, a push service might choose to ignore the provided
information.

To avoid requesting certificates from user agents, it might be necessary to
serve requests from user agents and requests from application servers on
different hostnames or port numbers.


## Alternatives

Several options have been proposed, here are some of the more concrete options.
Some options might even be better than the certificate-based option.

### Application Tokens {#token}

In this model, the push service vends a token to each application server that
requests it.  That token is kept secret and used as the basis for
authentication.

This doesn't address the need for contact information, but it addresses the need
for a consistent application server identifier.

A Cookie [RFC6265] is a token of this nature.  All the considerations regarding
the use (and misuse) of HTTP cookies apply should this option be chosen.  A
mechanism that makes token theft more difficult, such as
[I-D.ietf-tokbind-https] might be needed.  However that suggests a separate
option (see {{tokbind}}).

This information would be repeated with each request, but that overhead is
greatly reduced by header compression [RFC7541] in HTTP/2 [RFC7540].


### Contact Information Header Field

Contact information for an application server could be included in a header
field, either directly (e.g., a From header field, Section 5.5.1 of [RFC7231]),
or by reference (e.g., a new "contact" link relation [RFC5988] that identified a
vCard [RFC6350]).  Note that a From header field is limited to email addresses.

Like an application token {{token}}, contact information would need to be
repeated, though that cost is reduced with HTTP/2.


### Request Signing

Signing of push message requests would allow the push service to attribute
requests to an application server based on an asymmetric key.  This could be
done in any number of ways JWS [RFC7515] and HTTP signatures
[I-D.cavage-http-signatures] being the most likely options.  Note that the
latter does not provide a means of conveying the signing key, which would be
necessary for this application.

Request signing has several limitations:

* Deciding what to sign is challenging.  Signing only the body of a message is
  not sufficient to prevent message replay attacks.

* Every message contains a signature, which can increase the load on a server
  signficantly.  This is especially bad if a signature validation result is
  input to denial of service mitigation decision making.


### Token Binding {#tokbind}

The mechanism proposed in [I-D.ietf-tokbind-https] can be used to provide a
stable identifier for application servers.  This includes a signature over
material that is exported from the underlying TLS connection.  Importantly, this
does not require a new signature for each request: the same signature is
repeated for every request, HTTP/2 is again used to reduce the cost of the
repeated information.

Token binding could be used independently of cookies.  Consequently, an
application server would not be required to accept and store cookies, though the
push service would not be able to offload any state as a result.


# IANA Considerations

This document has no IANA actions (yet).


# Security Considerations

TLS 1.2 [RFC5246] does not provide any confidentiality protections for client
certificates.  A network attacker can therefore see the identification
information that is provided by the application server.  A push service MAY
choose to offer confidentiality protection for application server identity by
initiating TLS renegotiation immediately after establishing the TLS connection
at the cost of some additional latency.  Using TLS 1.3 [I-D.ietf-tls-tls13]
provides confidentiality protection for this information without additional
latency.

An application server might offer falsified contact information.  A push service
operator therefore cannot use the presence of unvalidated contact information as
input to any security-critical decision-making process.
